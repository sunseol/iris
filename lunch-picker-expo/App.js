import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Linking,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const RADIUS_OPTIONS = [500, 1000, 1500, 2000];
const EXCLUDE_DAYS_OPTIONS = [0, 1, 3, 7];
const BUDGET_OPTIONS = ['전체', '저가', '중가', '고가'];
const STORAGE_KEY = '@lunch_picker/state/v2';
const CACHE_KEY = '@lunch_picker/nearby_cache/v1';
const CACHE_TTL_MS = 45 * 60 * 1000;
const SHEET_COLLAPSED_OFFSET = 148;

const cuisineLabel = (tags = {}) => {
  if (!tags.cuisine) return '음식점';
  return String(tags.cuisine).split(';')[0].split(',')[0].replaceAll('_', ' ').trim();
};

const hashString = (value = '') => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getBudgetTier = (tags = {}, id = '') => {
  const raw = `${tags.price || tags['price:range'] || tags.charge || ''}`.toLowerCase();
  if (raw.includes('cheap') || raw.includes('low') || raw.includes('₩') || raw.includes('$')) return '저가';
  if (raw.includes('expensive') || raw.includes('high') || raw.includes('$$$') || raw.includes('$$$$')) return '고가';
  const bucket = hashString(id) % 10;
  if (bucket < 3) return '저가';
  if (bucket > 7) return '고가';
  return '중가';
};

const haversineDistanceM = (lat1, lon1, lat2, lon2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371e3;
  const f1 = toRad(lat1);
  const f2 = toRad(lat2);
  const df = toRad(lat2 - lat1);
  const dl = toRad(lon2 - lon1);
  const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (meters) => (meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`);

const fetchWithTimeout = async (url, options, timeoutMs = 12000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
  ]);

async function fetchNearbyRestaurants({ latitude, longitude, radius }) {
  const lightQuery = `
[out:json][timeout:18];
node["amenity"~"restaurant|fast_food|cafe"](around:${radius},${latitude},${longitude});
out body;
`;

  const fullQuery = `
[out:json][timeout:25];
(
  node["amenity"~"restaurant|fast_food|cafe"](around:${radius},${latitude},${longitude});
  way["amenity"~"restaurant|fast_food|cafe"](around:${radius},${latitude},${longitude});
  relation["amenity"~"restaurant|fast_food|cafe"](around:${radius},${latitude},${longitude});
);
out center tags;
`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  const queries = [lightQuery, fullQuery];
  let lastError = null;
  let elements = [];

  for (const query of queries) {
    for (const endpoint of endpoints) {
      try {
        let response;
        try {
          response = await fetchWithTimeout(
            endpoint,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
              body: `data=${encodeURIComponent(query)}`,
            },
            12000
          );
        } catch {
          const url = `${endpoint}?data=${encodeURIComponent(query)}`;
          response = await fetchWithTimeout(url, { method: 'GET' }, 12000);
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('응답 파싱 실패(JSON 아님)');
        }

        elements = data.elements ?? [];
        if (elements.length) break;
      } catch (err) {
        lastError = err;
      }
    }
    if (elements.length) break;
  }

  if (!elements.length && lastError) throw new Error('맛집 서버가 지금 불안정해요. 잠시 후 재시도해줘요.');

  const mapped = elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const name = el.tags?.name;
      if (!lat || !lon || !name) return null;

      return {
        id: `${el.type}-${el.id}`,
        name,
        category: cuisineLabel(el.tags),
        distanceM: haversineDistanceM(latitude, longitude, lat, lon),
        lat,
        lon,
        budgetTier: getBudgetTier(el.tags, `${el.type}-${el.id}`),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceM - b.distanceM);

  const unique = [];
  const seen = new Set();
  for (const item of mapped) {
    const key = item.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= 50) break;
  }

  return unique;
}

async function fetchWeatherSummary(latitude, longitude) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,weather_code&timezone=auto`;
    const res = await fetchWithTimeout(url, undefined, 10000);
    if (!res.ok) throw new Error(`weather HTTP ${res.status}`);
    const json = await res.json();
    const current = json?.current;
    if (!current) return null;

    const weatherCode = current.weather_code;
    const temp = current.temperature_2m;
    const precipitation = current.precipitation;

    const isRainy = (weatherCode >= 51 && weatherCode <= 82) || precipitation > 0;
    const isCold = temp <= 4;

    return {
      weatherCode,
      temp,
      precipitation,
      isRainy,
      isCold,
      summary: isRainy ? '비 오는 날' : isCold ? '추운 날' : '보통 날씨',
    };
  } catch {
    return null;
  }
}

const weatherBoostFor = (restaurant, weather) => {
  if (!weather) return 0;
  const text = `${restaurant.name} ${restaurant.category}`.toLowerCase();
  const hasSoup = /국|탕|찌개|샤브|전골|라멘|우동|쌀국수/.test(text);
  const indoor = /카페|restaurant|일식|중식|한식|양식|분식|패스트/.test(text);

  let boost = 0;
  if (weather.isRainy && indoor) boost += 0.35;
  if (weather.isCold && hasSoup) boost += 0.6;
  return boost;
};

function AppInner() {
  const insets = useSafeAreaInsets();

  const [radius, setRadius] = useState(1000);
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [picked, setPicked] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedBudget, setSelectedBudget] = useState('전체');
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [likedIds, setLikedIds] = useState([]);
  const [dislikedIds, setDislikedIds] = useState([]);
  const [history, setHistory] = useState([]);
  const [excludeDays, setExcludeDays] = useState(1);
  const [nearbyStatus, setNearbyStatus] = useState({ source: 'none', message: '', canRetry: false });
  const [weather, setWeather] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(1)).current;

  const persistState = async (next) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage write errors
    }
  };

  const getCacheBucket = (coords, currentRadius) => {
    if (!coords) return null;
    const lat = Math.round(coords.latitude * 100) / 100;
    const lon = Math.round(coords.longitude * 100) / 100;
    return `${lat}:${lon}:${currentRadius}`;
  };

  const writeNearbyCache = async (coords, currentRadius, list) => {
    try {
      const bucket = getCacheBucket(coords, currentRadius);
      if (!bucket) return;
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      const prev = raw ? JSON.parse(raw) : {};
      prev[bucket] = { ts: Date.now(), items: list };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(prev));
    } catch {
      // ignore cache write errors
    }
  };

  const readNearbyCache = async (coords, currentRadius) => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const bucket = getCacheBucket(coords, currentRadius);
      const entry = bucket ? parsed?.[bucket] : null;
      if (!entry?.items?.length) return null;
      if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
      return entry.items;
    } catch {
      return null;
    }
  };

  const isExcludedByRecent = (id) => {
    if (!excludeDays) return false;
    const threshold = Date.now() - excludeDays * 24 * 60 * 60 * 1000;
    return history.some((h) => h.id === id && h.ts >= threshold);
  };

  const categoryScore = useMemo(() => {
    const scores = {};
    const recentLimit = Date.now() - 21 * 24 * 60 * 60 * 1000;
    history.forEach((h) => {
      if (!h.category) return;
      scores[h.category] = (scores[h.category] || 0) + (h.ts >= recentLimit ? 0.12 : 0.05);
    });
    return scores;
  }, [history]);

  const categories = useMemo(() => {
    const base = ['전체'];
    const uniq = Array.from(new Set(restaurants.map((r) => r.category).filter(Boolean))).slice(0, 10);
    return [...base, ...uniq];
  }, [restaurants]);

  const filtered = useMemo(() => {
    let list = restaurants;
    if (selectedCategory !== '전체') list = list.filter((r) => r.category === selectedCategory);
    if (selectedBudget !== '전체') list = list.filter((r) => r.budgetTier === selectedBudget);
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
    }
    return list;
  }, [keyword, restaurants, selectedCategory, selectedBudget]);

  const recommendationPool = useMemo(
    () => filtered.filter((r) => !isExcludedByRecent(r.id)),
    [filtered, history, excludeDays]
  );

  const mapRegion = useMemo(() => {
    const base = filtered[0] || restaurants[0];
    if (!base) return null;
    return {
      latitude: base.lat,
      longitude: base.lon,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };
  }, [filtered, restaurants]);

  const animateSheetTo = (collapsed) => {
    Animated.spring(sheetTranslateY, {
      toValue: collapsed ? SHEET_COLLAPSED_OFFSET : 0,
      useNativeDriver: true,
      tension: 90,
      friction: 12,
    }).start();
    setIsSheetCollapsed(collapsed);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 28) animateSheetTo(true);
          else if (gesture.dy < -28) animateSheetTo(false);
        },
      }),
    []
  );

  const loadNearby = async (nextRadius = radius, forceRetry = false) => {
    let coords = location;
    try {
      setLoadingLocation(true);
      setPicked(null);
      setNearbyStatus((prev) => ({ ...prev, canRetry: false, message: '' }));

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한 필요', '주변 맛집 추천을 위해 위치 권한을 허용해줘.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setLocation(coords);

      setLoadingPlaces(true);
      const list = await fetchNearbyRestaurants({ ...coords, radius: nextRadius });
      if (!list.length) {
        const cached = await readNearbyCache(coords, nextRadius);
        if (cached?.length) {
          setRestaurants(cached);
          setNearbyStatus({ source: 'cache', message: '실시간 결과가 비어 캐시 목록을 표시해요', canRetry: true });
        } else {
          setRestaurants([]);
          setNearbyStatus({ source: 'error', message: '실시간 결과가 비어 있어요. 다시 시도해줘요.', canRetry: true });
        }
      } else {
        setRestaurants(list);
        setNearbyStatus({ source: 'live', message: '실시간 목록', canRetry: false });
        writeNearbyCache(coords, nextRadius, list);
      }

      const weatherSummary = await fetchWeatherSummary(coords.latitude, coords.longitude);
      setWeather(weatherSummary);
    } catch (error) {
      const cached = await readNearbyCache(coords, nextRadius);
      if (cached?.length) {
        setRestaurants(cached);
        setNearbyStatus({
          source: 'cache',
          message: forceRetry ? '재시도 실패: 최근 캐시 목록을 보여줘요' : '네트워크 불안정: 캐시 목록 표시 중',
          canRetry: true,
        });
      } else {
        setNearbyStatus({ source: 'error', message: '목록 불러오기 실패. 다시 시도해줘요.', canRetry: true });
        Alert.alert('불러오기 실패', `${error?.message ?? '네트워크 상태를 확인해줘.'}`);
      }
    } finally {
      setLoadingLocation(false);
      setLoadingPlaces(false);
    }
  };

  const pickRandomRestaurant = () => {
    const pool = recommendationPool.length ? recommendationPool : filtered;

    if (!pool.length) {
      Alert.alert('목록이 비었어', '필터를 완화하거나 주변 맛집을 새로 불러와줘!');
      return;
    }


    const weighted = pool.map((item) => {
      let weight = 1;
      if (likedIds.includes(item.id)) weight += 2;
      if (dislikedIds.includes(item.id)) weight = Math.max(0.15, weight - 0.9);
      weight += categoryScore[item.category] || 0;
      weight += weatherBoostFor(item, weather);
      return { item, weight };
    });

    const total = weighted.reduce((acc, cur) => acc + cur.weight, 0);
    let rnd = Math.random() * total;
    let chosen = weighted[0].item;
    for (const w of weighted) {
      rnd -= w.weight;
      if (rnd <= 0) {
        chosen = w.item;
        break;
      }
    }

    setPicked(chosen);
    setHistory((prev) => [{ id: chosen.id, category: chosen.category, ts: Date.now() }, ...prev].slice(0, 150));
    if (isSheetCollapsed) animateSheetTo(false);
  };

  const openDirections = async (item) => {
    const url = `https://maps.google.com/?q=${item.lat},${item.lon}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('지도 열기 실패', '기기에서 지도 링크를 열 수 없어요.');
      return;
    }
    Linking.openURL(url);
  };

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.likedIds)) setLikedIds(parsed.likedIds);
        if (Array.isArray(parsed.dislikedIds)) setDislikedIds(parsed.dislikedIds);
        if (Array.isArray(parsed.history)) setHistory(parsed.history.slice(0, 150));
        if (typeof parsed.excludeDays === 'number') setExcludeDays(parsed.excludeDays);
        if (typeof parsed.radius === 'number') setRadius(parsed.radius);
        if (typeof parsed.selectedBudget === 'string') setSelectedBudget(parsed.selectedBudget);
      } catch {
        // ignore storage read errors
      }
    })();
  }, []);

  useEffect(() => {
    loadNearby(radius);
  }, []);

  useEffect(() => {
    persistState({ likedIds, dislikedIds, history, excludeDays, radius, selectedBudget });
  }, [likedIds, dislikedIds, history, excludeDays, radius, selectedBudget]);

  useEffect(() => {
    if (!categories.includes(selectedCategory)) setSelectedCategory('전체');
  }, [categories, selectedCategory]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(resultAnim, { toValue: 0.8, duration: 90, useNativeDriver: true }),
      Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, friction: 6 }),
    ]).start();
  }, [picked, resultAnim]);

  const renderRow = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSub}>
          {item.category} · {item.budgetTier} · {formatDistance(item.distanceM)}
        </Text>
      </View>
      <Pressable style={styles.routeBtn} onPress={() => openDirections(item)}>
        <Text style={styles.routeBtnText}>길찾기</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.title}>내 주변 점심 추천 🍜</Text>
        <Text style={styles.subtitle}>개인 취향 + 날씨 + 거리로 오늘 점심을 빠르게 골라줄게.</Text>

        <View style={styles.tabRow}>
          {[
            { key: 'list', label: '리스트' },
            { key: 'map', label: '지도' },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tabBtn, active && styles.tabBtnActive]}>
                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.accordionHeader} onPress={() => setFiltersExpanded((v) => !v)}>
          <Text style={styles.accordionTitle}>필터 {filtersExpanded ? '접기' : '펼치기'}</Text>
          <Text style={styles.accordionArrow}>{filtersExpanded ? '▴' : '▾'}</Text>
        </Pressable>

        {filtersExpanded && (
          <>
            <View style={styles.controlsRow}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={RADIUS_OPTIONS}
                keyExtractor={(item) => String(item)}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => {
                  const active = item === radius;
                  return (
                    <Pressable
                      onPress={() => {
                        setRadius(item);
                        loadNearby(item);
                      }}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}m</Text>
                    </Pressable>
                  );
                }}
              />
              <Pressable style={styles.refreshBtn} onPress={() => loadNearby(radius, true)}>
                <Text style={styles.refreshBtnText}>재시도</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="가게 이름/종류 검색 (예: 국밥, sushi)"
              value={keyword}
              onChangeText={setKeyword}
            />

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item}
              style={styles.categoryList}
              contentContainerStyle={styles.categoryRow}
              renderItem={({ item }) => {
                const active = selectedCategory === item;
                return (
                  <Pressable onPress={() => setSelectedCategory(item)} style={[styles.categoryChip, active && styles.categoryChipActive]}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.categoryText, active && styles.categoryTextActive]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />

            <View style={styles.excludeRow}>
              <Text style={styles.excludeLabel}>예산</Text>
              {BUDGET_OPTIONS.map((budget) => {
                const active = selectedBudget === budget;
                return (
                  <Pressable
                    key={budget}
                    onPress={() => setSelectedBudget(budget)}
                    style={[styles.excludeChip, active && styles.excludeChipActive]}
                  >
                    <Text style={[styles.excludeChipText, active && styles.excludeChipTextActive]}>{budget}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.excludeRow}>
              <Text style={styles.excludeLabel}>중복 제외</Text>
              {EXCLUDE_DAYS_OPTIONS.map((day) => {
                const active = excludeDays === day;
                return (
                  <Pressable
                    key={String(day)}
                    onPress={() => setExcludeDays(day)}
                    style={[styles.excludeChip, active && styles.excludeChipActive]}
                  >
                    <Text style={[styles.excludeChipText, active && styles.excludeChipTextActive]}>{day === 0 ? '없음' : `${day}일`}</Text>
                  </Pressable>
                );
              })}
            </View>

            {!!weather && <Text style={styles.weatherText}>날씨 반영: {weather.summary} · {weather.temp}°C</Text>}
          </>
        )}

        {(loadingLocation || loadingPlaces) && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#1D7CF2" />
            <Text style={styles.loadingText}>근처 맛집 불러오는 중...</Text>
          </View>
        )}

        {!!nearbyStatus.message && !loadingPlaces && (
          <View style={[styles.statusBanner, nearbyStatus.source === 'cache' && styles.statusBannerWarn]}>
            <Text style={styles.statusBannerText}>{nearbyStatus.message}</Text>
            {nearbyStatus.canRetry && (
              <Pressable onPress={() => loadNearby(radius, true)}>
                <Text style={styles.statusRetryText}>다시 시도</Text>
              </Pressable>
            )}
          </View>
        )}

        {!loadingPlaces && !!location && (
          <Text style={styles.metaText}>현재 반경 {radius}m · 결과 {filtered.length}개</Text>
        )}

        {activeTab === 'list' ? (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={{ gap: 10, paddingBottom: 220 + insets.bottom }}
            renderItem={renderRow}
            ListEmptyComponent={
              !loadingPlaces ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>조건에 맞는 맛집이 없어요. 반경/필터를 조정해봐!</Text>
                </View>
              ) : null
            }
          />
        ) : (
          <View style={styles.mapWrap}>
            {mapRegion ? (
              <>
                <MapView style={styles.mapView} initialRegion={mapRegion} region={mapRegion}>
                  {filtered.slice(0, 20).map((item) => (
                    <Marker
                      key={item.id}
                      coordinate={{ latitude: item.lat, longitude: item.lon }}
                      title={item.name}
                      description={`${item.category} · ${formatDistance(item.distanceM)}`}
                      onCalloutPress={() => openDirections(item)}
                    />
                  ))}
                </MapView>

                <FlatList
                  data={filtered.slice(0, 5)}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.mapCarousel}
                  renderItem={({ item }) => (
                    <Pressable style={styles.mapPinCard} onPress={() => openDirections(item)}>
                      <Text style={styles.mapPinTitle}>{item.name}</Text>
                      <Text style={styles.mapPinMeta}>{item.category} · {formatDistance(item.distanceM)}</Text>
                    </Pressable>
                  )}
                />
              </>
            ) : (
              <View style={styles.mapEmpty}>
                <Text style={styles.emptyText}>표시할 장소가 없어요.</Text>
              </View>
            )}
          </View>
        )}

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              paddingBottom: Math.max(insets.bottom + 8, 14),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.sheetHandleWrap} {...panResponder.panHandlers}>
            <View style={styles.sheetHandle} />
            <Pressable onPress={() => animateSheetTo(!isSheetCollapsed)}>
              <Text style={styles.sheetHint}>{isSheetCollapsed ? '위로 펼치기' : '아래로 접기'}</Text>
            </Pressable>
          </View>

          <Animated.View style={{ transform: [{ scale: resultAnim }], opacity: resultAnim }}>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>오늘의 추천</Text>
              <Text style={styles.resultText}>{picked ? picked.name : '아직 안 골랐어'}</Text>
              {picked ? (
                <>
                  <Text style={styles.resultMeta}>
                    {picked.category} · {picked.budgetTier} · {formatDistance(picked.distanceM)}
                  </Text>
                  <View style={styles.resultActionsRow}>
                    <Pressable style={styles.resultRouteBtn} onPress={() => openDirections(picked)}>
                      <Text style={styles.resultRouteBtnText}>추천 맛집 길찾기</Text>
                    </Pressable>
                    <Pressable
                      style={styles.feedbackBtn}
                      onPress={() => {
                        setLikedIds((prev) => Array.from(new Set([picked.id, ...prev])));
                        setDislikedIds((prev) => prev.filter((id) => id !== picked.id));
                      }}
                    >
                      <Text style={styles.feedbackBtnText}>좋아요</Text>
                    </Pressable>
                    <Pressable
                      style={styles.feedbackBtn}
                      onPress={() => {
                        setDislikedIds((prev) => Array.from(new Set([picked.id, ...prev])));
                        setLikedIds((prev) => prev.filter((id) => id !== picked.id));
                      }}
                    >
                      <Text style={styles.feedbackBtnText}>패스</Text>
                    </Pressable>
                  </View>
                </>
              ) : null}
            </View>
          </Animated.View>

          <Pressable style={styles.pickBtn} onPress={pickRandomRestaurant}>
            <Text style={styles.pickBtnText}>랜덤으로 한 곳 뽑기</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FB' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 30, fontWeight: '800', color: '#121212', letterSpacing: -0.4 },
  subtitle: { marginTop: 4, marginBottom: 10, color: '#52525B', lineHeight: 20 },
  tabRow: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E2EF',
    borderRadius: 10,
    paddingVertical: 7,
    backgroundColor: '#F0F4FA',
  },
  tabBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  tabBtnText: { color: '#334155', fontWeight: '700' },
  tabBtnTextActive: { color: '#FFFFFF' },
  accordionHeader: {
    marginTop: 2,
    marginBottom: 8,
    backgroundColor: '#EEF2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionTitle: { color: '#334155', fontWeight: '700' },
  accordionArrow: { color: '#64748B', fontSize: 14 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#EBEEF5' },
  chipActive: { backgroundColor: '#1D7CF2' },
  chipText: { fontWeight: '700', color: '#374151' },
  chipTextActive: { color: 'white' },
  refreshBtn: {
    marginLeft: 'auto',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  refreshBtnText: { color: 'white', fontWeight: '700' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D8DEE9',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  categoryList: { maxHeight: 42, marginBottom: 6 },
  categoryRow: { gap: 8, alignItems: 'center' },
  categoryChip: {
    maxWidth: 140,
    minHeight: 34,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#EEF2F7',
    justifyContent: 'center',
  },
  categoryChipActive: { backgroundColor: '#0F172A' },
  categoryText: { color: '#334155', fontWeight: '700', fontSize: 13 },
  categoryTextActive: { color: '#FFFFFF' },
  excludeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  excludeLabel: { color: '#64748B', fontSize: 12, marginRight: 2 },
  excludeChip: { borderRadius: 999, backgroundColor: '#EEF2F7', paddingHorizontal: 8, paddingVertical: 5 },
  excludeChipActive: { backgroundColor: '#1D7CF2' },
  excludeChipText: { color: '#334155', fontWeight: '700', fontSize: 12 },
  excludeChipTextActive: { color: 'white' },
  weatherText: { color: '#245AA5', marginBottom: 6, fontWeight: '600' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  loadingText: { color: '#1D7CF2', fontWeight: '600' },
  statusBanner: {
    backgroundColor: '#E8F1FF',
    borderWidth: 1,
    borderColor: '#CCE0FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusBannerWarn: { backgroundColor: '#FFF7E6', borderColor: '#FFD699' },
  statusBannerText: { color: '#334155', flex: 1, fontSize: 12, fontWeight: '600' },
  statusRetryText: { color: '#1D4ED8', fontWeight: '800' },
  metaText: { color: '#64748B', marginBottom: 8 },
  list: { flex: 1 },
  mapWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4EBF5',
    backgroundColor: '#F8FAFD',
  },
  mapView: { flex: 1 },
  mapCarousel: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 220,
    gap: 8,
    paddingRight: 10,
  },
  mapPinCard: {
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6EDF8',
    padding: 10,
  },
  mapPinTitle: { fontWeight: '700', color: '#0F172A' },
  mapPinMeta: { marginTop: 2, color: '#64748B', fontSize: 12 },
  mapEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomSheet: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    paddingTop: 8,
    paddingHorizontal: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  sheetHandleWrap: { alignItems: 'center', paddingBottom: 2 },
  sheetHandle: { width: 42, height: 5, borderRadius: 999, backgroundColor: '#CBD5E1', marginBottom: 3 },
  sheetHint: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEFF5',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardSub: { marginTop: 2, color: '#6B7280' },
  routeBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DCE6FF',
  },
  routeBtnText: { color: '#1E40AF', fontWeight: '700', fontSize: 12 },
  emptyWrap: { paddingTop: 14 },
  emptyText: { color: '#6B7280' },
  resultBox: {
    marginTop: 8,
    backgroundColor: '#E8F1FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D7E6FF',
  },
  resultLabel: { color: '#245AA5', fontWeight: '700' },
  resultText: { marginTop: 3, fontSize: 22, fontWeight: '800', color: '#0F172A' },
  resultMeta: { marginTop: 2, color: '#334155' },
  resultActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  resultRouteBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#CFE0FF',
  },
  resultRouteBtnText: { color: '#1E40AF', fontWeight: '700', fontSize: 13 },
  feedbackBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DDE3EC',
  },
  feedbackBtnText: { color: '#334155', fontWeight: '700', fontSize: 13 },
  pickBtn: {
    backgroundColor: '#1D7CF2',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 9,
  },
  pickBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});

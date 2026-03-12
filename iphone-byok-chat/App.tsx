import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Role = 'user' | 'assistant';

type Message = {
  id: string;
  role: Role;
  content: string;
};

const KEYCHAIN_NAME = 'OPENAI_API_KEY';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [input, setInput] = useState('');
  const [model, setModel] = useState('gpt-4.1-mini');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync(KEYCHAIN_NAME);
      if (saved) setApiKey(saved);
    })();
  }, []);

  const canSend = useMemo(() => !!apiKey.trim() && !!input.trim() && !loading, [apiKey, input, loading]);

  const saveKey = async () => {
    await SecureStore.setItemAsync(KEYCHAIN_NAME, apiKey.trim());
  };

  const clearKey = async () => {
    await SecureStore.deleteItemAsync(KEYCHAIN_NAME);
    setApiKey('');
  };

  const ask = async () => {
    const userText = input.trim();
    if (!userText || !apiKey.trim()) return;

    const userMessage: Message = {
      id: `${Date.now()}-u`,
      role: 'user',
      content: userText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          input: userText,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const answer = data?.output_text ?? '응답을 파싱하지 못했어.';

      const aiMessage: Message = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: String(answer),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const aiMessage: Message = {
        id: `${Date.now()}-e`,
        role: 'assistant',
        content: `오류: ${error?.message ?? 'unknown error'}`,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>BYOK Chat (iPhone)</Text>

        <View style={styles.keyRow}>
          <TextInput
            placeholder="OpenAI API Key (sk-...)"
            placeholderTextColor="#8d95a3"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            style={[styles.input, styles.keyInput]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.btn} onPress={saveKey}>
            <Text style={styles.btnText}>저장</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={clearKey}>
            <Text style={styles.btnText}>삭제</Text>
          </Pressable>
        </View>

        <TextInput
          placeholder="모델 (예: gpt-4.1-mini)"
          placeholderTextColor="#8d95a3"
          value={model}
          onChangeText={setModel}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FlatList
          style={styles.list}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={styles.role}>{item.role === 'user' ? '나' : 'AI'}</Text>
              <Text style={styles.msg}>{item.content}</Text>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            placeholder="메시지 입력..."
            placeholderTextColor="#8d95a3"
            value={input}
            onChangeText={setInput}
            style={[styles.input, styles.messageInput]}
            multiline
          />
          <Pressable style={[styles.btn, !canSend && styles.btnDisabled]} onPress={ask} disabled={!canSend}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>전송</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f1115',
  },
  container: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keyInput: {
    flex: 1,
  },
  input: {
    backgroundColor: '#1a1f28',
    borderWidth: 1,
    borderColor: '#2b3340',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  list: {
    flex: 1,
    marginTop: 4,
  },
  bubble: {
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: '#253040',
  },
  aiBubble: {
    backgroundColor: '#1a2230',
  },
  role: {
    color: '#9fc4ff',
    fontWeight: '700',
    marginBottom: 4,
  },
  msg: {
    color: '#e5e7eb',
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 130,
  },
  btn: {
    backgroundColor: '#2d6df6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGhost: {
    backgroundColor: '#374151',
  },
  btnDisabled: {
    backgroundColor: '#4b5563',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
});

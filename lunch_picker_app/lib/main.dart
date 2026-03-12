import 'dart:math';

import 'package:flutter/material.dart';

void main() {
  runApp(const LunchPickerApp());
}

class LunchPickerApp extends StatelessWidget {
  const LunchPickerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '점심 뭐 먹지?',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.orange),
        useMaterial3: true,
      ),
      home: const LunchPickerHomePage(),
    );
  }
}

class LunchPickerHomePage extends StatefulWidget {
  const LunchPickerHomePage({super.key});

  @override
  State<LunchPickerHomePage> createState() => _LunchPickerHomePageState();
}

class _LunchPickerHomePageState extends State<LunchPickerHomePage> {
  final List<String> _menus = [
    '김치찌개',
    '된장찌개',
    '제육볶음',
    '비빔밥',
    '돈까스',
    '초밥',
    '라멘',
    '쌀국수',
  ];

  final TextEditingController _menuController = TextEditingController();
  final Random _random = Random();

  String? _pickedMenu;

  void _pickRandomMenu() {
    if (_menus.isEmpty) {
      setState(() => _pickedMenu = null);
      return;
    }

    setState(() {
      _pickedMenu = _menus[_random.nextInt(_menus.length)];
    });
  }

  void _addMenu() {
    final text = _menuController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _menus.add(text);
      _menuController.clear();
    });
  }

  void _removeMenu(int index) {
    setState(() {
      _menus.removeAt(index);
      if (_pickedMenu != null && !_menus.contains(_pickedMenu)) {
        _pickedMenu = null;
      }
    });
  }

  @override
  void dispose() {
    _menuController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('점심 뭐 먹지?'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _menuController,
              decoration: InputDecoration(
                labelText: '메뉴 추가',
                hintText: '예: 순두부찌개',
                suffixIcon: IconButton(
                  onPressed: _addMenu,
                  icon: const Icon(Icons.add),
                ),
              ),
              onSubmitted: (_) => _addMenu(),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: _menus.isEmpty
                  ? const Center(child: Text('메뉴를 하나 이상 추가해 주세요.'))
                  : ListView.separated(
                      itemCount: _menus.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        return ListTile(
                          title: Text(_menus[index]),
                          trailing: IconButton(
                            onPressed: () => _removeMenu(index),
                            icon: const Icon(Icons.delete_outline),
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 16),
            if (_pickedMenu != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.secondaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '오늘의 점심: $_pickedMenu',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _pickRandomMenu,
                icon: const Icon(Icons.casino_outlined),
                label: const Text('랜덤으로 고르기'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

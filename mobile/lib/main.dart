import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'fitknow_data.dart';
import 'fitknow_theme.dart';
import 'home_screen.dart';
import 'knowledge_screen.dart';
import 'nutrition_hub_screen.dart';
import 'tools_screen.dart';
import 'training_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: FitColors.background,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: FitColors.surface,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const FitKnowApp());
}

class FitKnowApp extends StatelessWidget {
  const FitKnowApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'FitKnow',
    theme: fitKnowTheme(),
    home: FutureBuilder<FitKnowData>(
      future: FitKnowData.load(),
      builder: (context, snapshot) {
        if (snapshot.hasError) return _LoadError(error: snapshot.error);
        if (!snapshot.hasData) return const _LoadingScreen();
        return FitKnowShell(data: snapshot.data!);
      },
    ),
  );
}

class FitKnowShell extends StatefulWidget {
  const FitKnowShell({super.key, required this.data});
  final FitKnowData data;

  @override
  State<FitKnowShell> createState() => _FitKnowShellState();
}

class _FitKnowShellState extends State<FitKnowShell> {
  var _index = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(
        plans: widget.data.trainingPlans,
        onNavigate: (value) => setState(() => _index = value),
      ),
      TrainingScreen(plans: widget.data.trainingPlans),
      NutritionHubScreen(foods: widget.data.foods),
      ToolsScreen(cardio: widget.data.cardio),
      KnowledgeScreen(
        questions: widget.data.questions,
        dietPlans: widget.data.dietPlans,
      ),
    ];
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Container(
              height: 58,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              decoration: const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: FitColors.line, width: .5),
                ),
              ),
              child: const Row(
                children: [
                  Expanded(
                    child: Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: 'FITKNOW',
                            style: TextStyle(
                              fontSize: 18,
                              letterSpacing: 1.1,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          TextSpan(
                            text: '.',
                            style: TextStyle(
                              color: FitColors.accent,
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Text(
                    '● OFFLINE',
                    style: TextStyle(
                      color: FitColors.muted,
                      fontSize: 9,
                      letterSpacing: 1.1,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 260),
                switchInCurve: Curves.easeOutCubic,
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween(
                      begin: const Offset(0, .025),
                      end: Offset.zero,
                    ).animate(animation),
                    child: child,
                  ),
                ),
                child: KeyedSubtree(
                  key: ValueKey(_index),
                  child: screens[_index],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.grid_view_outlined),
            selectedIcon: Icon(Icons.grid_view),
            label: '首页',
          ),
          NavigationDestination(
            icon: Icon(Icons.fitness_center_outlined),
            selectedIcon: Icon(Icons.fitness_center),
            label: '训练',
          ),
          NavigationDestination(
            icon: Icon(Icons.restaurant_outlined),
            selectedIcon: Icon(Icons.restaurant),
            label: '营养',
          ),
          NavigationDestination(
            icon: Icon(Icons.calculate_outlined),
            selectedIcon: Icon(Icons.calculate),
            label: '工具',
          ),
          NavigationDestination(
            icon: Icon(Icons.library_books_outlined),
            selectedIcon: Icon(Icons.library_books),
            label: '知识',
          ),
        ],
      ),
    );
  }
}

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();
  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 18),
          Text('正在加载 FitKnow 离线数据…', style: TextStyle(color: FitColors.muted)),
        ],
      ),
    ),
  );
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.error});
  final Object? error;
  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text('离线数据加载失败\n$error', textAlign: TextAlign.center),
      ),
    ),
  );
}

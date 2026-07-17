import 'package:flutter/material.dart';

import 'fitknow_theme.dart';
import 'ui.dart';

class KnowledgeScreen extends StatefulWidget {
  const KnowledgeScreen({
    super.key,
    required this.questions,
    required this.dietPlans,
  });

  final List<Map<String, dynamic>> questions;
  final List<Map<String, dynamic>> dietPlans;

  @override
  State<KnowledgeScreen> createState() => _KnowledgeScreenState();
}

class _KnowledgeScreenState extends State<KnowledgeScreen> {
  var _dietMode = false;
  var _query = '';

  @override
  Widget build(BuildContext context) {
    final needle = _query.trim().toLowerCase();
    final source = _dietMode ? widget.dietPlans : widget.questions;
    final items = source
        .where((item) => item.values.join(' ').toLowerCase().contains(needle))
        .toList();
    return CustomScrollView(
      key: const PageStorageKey('knowledge'),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      slivers: [
        const SliverToBoxAdapter(
          child: PageHeading(kicker: 'Knowledge / 健身知识', title: '把问题带进训练'),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverToBoxAdapter(
            child: SegmentedButton<bool>(
              segments: const [
                ButtonSegment(
                  value: false,
                  label: Text('常见问答'),
                  icon: Icon(Icons.forum_outlined),
                ),
                ButtonSegment(
                  value: true,
                  label: Text('饮食方案'),
                  icon: Icon(Icons.restaurant_menu),
                ),
              ],
              selected: {_dietMode},
              onSelectionChanged: (value) =>
                  setState(() => _dietMode = value.first),
              showSelectedIcon: false,
              style: const ButtonStyle(
                shape: WidgetStatePropertyAll(RoundedRectangleBorder()),
              ),
            ),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 14)),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverToBoxAdapter(
            child: TextField(
              onChanged: (value) => setState(() => _query = value),
              decoration: const InputDecoration(
                hintText: '搜索问题或方案',
                prefixIcon: Icon(Icons.search, color: FitColors.muted),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: SectionHeading(
            index: _dietMode ? 'PLAN' : 'QA',
            title: _dietMode ? '饮食时间方案' : '高频问题',
            trailing: '${items.length} 条',
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
          sliver: SliverList.separated(
            itemCount: items.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final item = items[index];
              final isDiet = _dietMode;
              final title = textOf(item, isDiet ? 'title' : 'question');
              return InkWell(
                onTap: () => showFitDetails(
                  context,
                  eyebrow: isDiet
                      ? (textOf(item, 'goal') == 'fat-loss' ? '减脂方案' : '增肌方案')
                      : textOf(item, 'category'),
                  title: title,
                  meta: isDiet ? textOf(item, 'timing') : null,
                  body: textOf(item, isDiet ? 'summary' : 'answer'),
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(minHeight: 76),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 34,
                        child: Text(
                          isDiet
                              ? (textOf(item, 'goal') == 'fat-loss' ? '减' : '增')
                              : '${index + 1}'.padLeft(2, '0'),
                          style: const TextStyle(
                            color: FitColors.accent,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontSize: 15,
                              height: 1.45,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.arrow_forward,
                        color: FitColors.accent,
                        size: 20,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

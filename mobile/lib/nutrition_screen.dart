import 'package:flutter/material.dart';

import 'fitknow_theme.dart';
import 'ui.dart';

class NutritionScreen extends StatefulWidget {
  const NutritionScreen({super.key, required this.foods});

  final List<Map<String, dynamic>> foods;

  @override
  State<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends State<NutritionScreen> {
  var _query = '';
  var _macroIndex = 0;

  @override
  Widget build(BuildContext context) {
    final macros = <String>[
      '全部',
      ...widget.foods.map((item) => textOf(item, 'macroType')).toSet(),
    ];
    final macro = macros[_macroIndex];
    final needle = _query.trim().toLowerCase();
    final filtered = widget.foods.where((food) {
      final content =
          '${textOf(food, 'name')}${textOf(food, 'group')}${textOf(food, 'explanation')}'
              .toLowerCase();
      return (needle.isEmpty || content.contains(needle)) &&
          (macro == '全部' || textOf(food, 'macroType') == macro);
    }).toList();

    return CustomScrollView(
      key: const PageStorageKey('nutrition'),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      slivers: [
        const SliverToBoxAdapter(
          child: PageHeading(kicker: 'Nutrition / 食物营养', title: '吃得清楚一点'),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverToBoxAdapter(
            child: TextField(
              onChanged: (value) => setState(() => _query = value),
              textInputAction: TextInputAction.search,
              decoration: const InputDecoration(
                hintText: '搜索米饭、鸡胸、牛奶…',
                prefixIcon: Icon(Icons.search, color: FitColors.muted),
              ),
            ),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 14)),
        SliverToBoxAdapter(
          child: FilterChipRow(
            labels: macros,
            selected: _macroIndex,
            onSelected: (index) => setState(() => _macroIndex = index),
          ),
        ),
        SliverToBoxAdapter(
          child: SectionHeading(
            index: 'DB',
            title: '营养率数据库',
            trailing: '${filtered.length} 条',
          ),
        ),
        if (filtered.isEmpty)
          const SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
              child: Text('没有找到相关食物', style: TextStyle(color: FitColors.muted)),
            ),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
            sliver: SliverList.separated(
              itemCount: filtered.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final food = filtered[index];
                final rate = textOf(food, 'rate');
                return InkWell(
                  onTap: () => showFitDetails(
                    context,
                    eyebrow:
                        '${textOf(food, 'macroType')} / ${textOf(food, 'group')}',
                    title: textOf(food, 'name'),
                    meta:
                        '营养率 ${rate.isEmpty ? '—' : rate}${textOf(food, 'giOrPosition').isEmpty ? '' : ' · GI/位置 ${textOf(food, 'giOrPosition')}'}',
                    body: textOf(food, 'explanation'),
                  ),
                  child: SizedBox(
                    height: 72,
                    child: Row(
                      children: [
                        SizedBox(
                          width: 58,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                rate.isEmpty ? '—' : rate,
                                style: const TextStyle(
                                  color: FitColors.accent,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const Text(
                                '营养率',
                                style: TextStyle(
                                  color: FitColors.muted,
                                  fontSize: 9,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                textOf(food, 'name'),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${textOf(food, 'group')} · ${textOf(food, 'macroType')}',
                                style: const TextStyle(
                                  color: FitColors.muted,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right, color: FitColors.muted),
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

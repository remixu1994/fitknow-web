import 'package:flutter/material.dart';

import 'fitknow_theme.dart';
import 'ui.dart';

class TrainingScreen extends StatefulWidget {
  const TrainingScreen({super.key, required this.plans});

  final List<Map<String, dynamic>> plans;

  @override
  State<TrainingScreen> createState() => _TrainingScreenState();
}

class _TrainingScreenState extends State<TrainingScreen> {
  var _planIndex = 0;
  var _dayIndex = 0;

  @override
  Widget build(BuildContext context) {
    final plan = widget.plans[_planIndex];
    final days = mapsOf(plan['days']);
    final day = days[_dayIndex.clamp(0, days.length - 1)];
    final rows = mapsOf(
      day['rows'],
    ).where((row) => textOf(row, 'exercise').isNotEmpty).toList();
    final info = mapsOf(plan['info']);

    return CustomScrollView(
      key: const PageStorageKey('training'),
      slivers: [
        const SliverToBoxAdapter(
          child: PageHeading(kicker: 'Program / 训练计划', title: '今天练什么'),
        ),
        SliverToBoxAdapter(
          child: FilterChipRow(
            labels: widget.plans
                .map((item) => textOf(item, 'title').replaceAll('训练计划', ''))
                .toList(),
            selected: _planIndex,
            onSelected: (index) => setState(() {
              _planIndex = index;
              _dayIndex = 0;
            }),
          ),
        ),
        SliverToBoxAdapter(
          child: Container(
            margin: const EdgeInsets.fromLTRB(20, 20, 20, 18),
            padding: const EdgeInsets.symmetric(vertical: 20),
            decoration: const BoxDecoration(
              border: Border.symmetric(
                horizontal: BorderSide(color: FitColors.line),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  textOf(plan, 'title'),
                  style: const TextStyle(
                    fontSize: 22,
                    height: 1.3,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 7),
                Text(
                  '${textOf(plan, 'environment') == 'gym' ? '健身房' : '居家'} · ${textOf(plan, 'splitType')} · 共 ${days.length} 日',
                  style: const TextStyle(color: FitColors.muted, fontSize: 12),
                ),
                const SizedBox(height: 14),
                GestureDetector(
                  onTap: () {
                    final item = info.length > 1 ? info[1] : info.first;
                    showFitDetails(
                      context,
                      eyebrow: '执行说明',
                      title: textOf(item, 'label'),
                      body: textOf(item, 'detail'),
                    );
                  },
                  child: const Text(
                    '查看执行说明  →',
                    style: TextStyle(
                      color: FitColors.accent,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: FilterChipRow(
            labels: List.generate(days.length, (index) => 'D${index + 1}'),
            selected: _dayIndex,
            onSelected: (index) => setState(() => _dayIndex = index),
          ),
        ),
        SliverToBoxAdapter(
          child: SectionHeading(
            index: 'D${_dayIndex + 1}',
            title: textOf(
              day,
              'title',
            ).replaceFirst(RegExp(r'^Day\d+[：:]?'), ''),
            trailing: '${rows.length} 项',
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
          sliver: SliverList.separated(
            itemCount: rows.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final row = rows[index];
              final detail = [
                textOf(row, 'notes'),
                textOf(row, 'shoulderJoint'),
                textOf(row, 'elbowJoint'),
              ].where((value) => value.isNotEmpty).join('\n\n');
              return InkWell(
                onTap: () => showFitDetails(
                  context,
                  eyebrow: textOf(row, 'muscleGroup').isEmpty
                      ? '训练动作'
                      : textOf(row, 'muscleGroup'),
                  title: textOf(row, 'exercise'),
                  meta: textOf(row, 'setGuidance'),
                  body: detail,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 34,
                        child: Text(
                          '${index + 1}'.padLeft(2, '0'),
                          style: const TextStyle(
                            color: FitColors.muted,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              textOf(row, 'muscleGroup'),
                              style: const TextStyle(
                                color: FitColors.accent,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              textOf(row, 'exercise'),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 5),
                            Text(
                              textOf(row, 'setGuidance').isEmpty
                                  ? '按训练能力安排组数'
                                  : textOf(row, 'setGuidance'),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: FitColors.muted,
                                fontSize: 12,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.add, color: FitColors.accent, size: 22),
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

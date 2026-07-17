import 'package:flutter/material.dart';

import 'fitknow_theme.dart';
import 'ui.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.plans, required this.onNavigate});

  final List<Map<String, dynamic>> plans;
  final ValueChanged<int> onNavigate;

  @override
  Widget build(BuildContext context) {
    final plan = plans.firstWhere(
      (item) => textOf(item, 'environment') == 'gym',
      orElse: () => plans.first,
    );
    final days = mapsOf(plan['days']);
    final day = days.first;
    final exerciseCount = mapsOf(
      day['rows'],
    ).where((row) => textOf(row, 'exercise').isNotEmpty).length;
    return ListView(
      key: const PageStorageKey('home'),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
      children: [
        SizedBox(
          height: 330,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              const Positioned(
                right: -20,
                top: -12,
                child: Text(
                  'FK',
                  style: TextStyle(
                    color: Color(0xFF111615),
                    fontSize: 180,
                    height: 1,
                    letterSpacing: -15,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'FITKNOW / MOBILE',
                    style: TextStyle(
                      color: FitColors.accent,
                      fontSize: 10,
                      letterSpacing: 2.4,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    '知道下一组，\n练得更明白。',
                    style: TextStyle(
                      fontSize: 41,
                      height: 1.14,
                      letterSpacing: -1.8,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    '训练、饮食和常用计算，全部离线随身查。',
                    style: TextStyle(
                      color: FitColors.muted,
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 26),
                  FilledButton.icon(
                    onPressed: () => onNavigate(1),
                    iconAlignment: IconAlignment.end,
                    icon: const Icon(Icons.arrow_forward),
                    label: const Text('查看训练计划'),
                    style: const ButtonStyle(
                      shape: WidgetStatePropertyAll(RoundedRectangleBorder()),
                      padding: WidgetStatePropertyAll(
                        EdgeInsets.symmetric(horizontal: 18, vertical: 15),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Container(
          decoration: const BoxDecoration(
            border: Border.symmetric(
              horizontal: BorderSide(color: FitColors.line),
            ),
          ),
          child: Row(
            children: const [
              _Stat(value: '04', label: '训练计划'),
              _Stat(value: '102', label: '食物条目'),
              _Stat(value: '44', label: '常见问答', last: true),
            ],
          ),
        ),
        const SizedBox(height: 26),
        _LocalSectionHeading(
          index: '01',
          title: '今日建议',
          trailing: '$exerciseCount 个动作',
        ),
        InkWell(
          onTap: () => onNavigate(1),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 18),
            decoration: const BoxDecoration(
              border: Border.symmetric(
                horizontal: BorderSide(color: FitColors.line),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  color: FitColors.accentDark,
                  child: const Icon(
                    Icons.fitness_center,
                    color: FitColors.accent,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${textOf(plan, 'splitType')} · 健身房',
                        style: const TextStyle(
                          color: FitColors.accent,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        textOf(day, 'title'),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 5),
                      const Text(
                        '先确认动作和组数，再进入训练。',
                        style: TextStyle(color: FitColors.muted, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: FitColors.muted),
              ],
            ),
          ),
        ),
        const SizedBox(height: 28),
        const _LocalSectionHeading(index: '02', title: '快速入口'),
        _QuickRow(
          icon: Icons.restaurant_outlined,
          title: '食物营养',
          body: '102 条离线数据',
          onTap: () => onNavigate(2),
        ),
        _QuickRow(
          icon: Icons.calculate_outlined,
          title: '训练计算',
          body: '1RM 与有氧消耗',
          onTap: () => onNavigate(3),
        ),
        _QuickRow(
          icon: Icons.forum_outlined,
          title: '健身问答',
          body: '44 个高频问题',
          onTap: () => onNavigate(4),
        ),
        const SizedBox(height: 20),
        const Text(
          '内容仅供健身学习和日常参考，不能替代医生、营养师或专业教练建议。',
          style: TextStyle(color: FitColors.muted, fontSize: 10, height: 1.6),
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label, this.last = false});
  final String value;
  final String label;
  final bool last;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 18),
      decoration: last
          ? null
          : const BoxDecoration(
              border: Border(right: BorderSide(color: FitColors.line)),
            ),
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(color: FitColors.muted, fontSize: 10),
          ),
        ],
      ),
    ),
  );
}

class _LocalSectionHeading extends StatelessWidget {
  const _LocalSectionHeading({
    required this.index,
    required this.title,
    this.trailing,
  });
  final String index;
  final String title;
  final String? trailing;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 11),
    child: Row(
      children: [
        Text(
          index,
          style: const TextStyle(
            color: FitColors.accent,
            fontSize: 10,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(width: 9),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w900),
          ),
        ),
        if (trailing != null)
          Text(
            trailing!,
            style: const TextStyle(color: FitColors.muted, fontSize: 11),
          ),
      ],
    ),
  );
}

class _QuickRow extends StatelessWidget {
  const _QuickRow({
    required this.icon,
    required this.title,
    required this.body,
    required this.onTap,
  });
  final IconData icon;
  final String title;
  final String body;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    child: Container(
      height: 72,
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: FitColors.line)),
      ),
      child: Row(
        children: [
          Icon(icon, color: FitColors.accent),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: const TextStyle(color: FitColors.muted, fontSize: 11),
                ),
              ],
            ),
          ),
          const Icon(Icons.north_east, color: FitColors.muted, size: 18),
        ],
      ),
    ),
  );
}

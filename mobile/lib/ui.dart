import 'package:flutter/material.dart';

import 'fitknow_theme.dart';

class PageHeading extends StatelessWidget {
  const PageHeading({super.key, required this.kicker, required this.title});

  final String kicker;
  final String title;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 24, 20, 22),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          kicker.toUpperCase(),
          style: const TextStyle(
            color: FitColors.accent,
            fontSize: 10,
            letterSpacing: 2.2,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 9),
        Text(
          title,
          style: const TextStyle(
            color: FitColors.text,
            fontSize: 34,
            height: 1.12,
            letterSpacing: -1.2,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    ),
  );
}

class SectionHeading extends StatelessWidget {
  const SectionHeading({
    super.key,
    required this.index,
    required this.title,
    this.trailing,
  });

  final String index;
  final String title;
  final String? trailing;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 12, 20, 10),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
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

class FilterChipRow extends StatelessWidget {
  const FilterChipRow({
    super.key,
    required this.labels,
    required this.selected,
    required this.onSelected,
  });

  final List<String> labels;
  final int selected;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    scrollDirection: Axis.horizontal,
    padding: const EdgeInsets.symmetric(horizontal: 20),
    child: Row(
      children: List.generate(labels.length, (index) {
        final active = index == selected;
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: ChoiceChip(
            label: Text(labels[index]),
            selected: active,
            onSelected: (_) => onSelected(index),
            side: BorderSide(color: active ? FitColors.accent : FitColors.line),
            selectedColor: FitColors.accent,
            backgroundColor: FitColors.surface,
            labelStyle: TextStyle(
              color: active ? FitColors.background : FitColors.muted,
              fontSize: 12,
              fontWeight: active ? FontWeight.w900 : FontWeight.w700,
            ),
            shape: const RoundedRectangleBorder(),
          ),
        );
      }),
    ),
  );
}

void showFitDetails(
  BuildContext context, {
  required String eyebrow,
  required String title,
  required String body,
  String? meta,
}) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: FitColors.surface,
    shape: const RoundedRectangleBorder(),
    builder: (context) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: .72,
      minChildSize: .42,
      maxChildSize: .94,
      builder: (context, controller) => Column(
        children: [
          const SizedBox(height: 10),
          Container(width: 42, height: 4, color: FitColors.line),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 12, 14),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    eyebrow.toUpperCase(),
                    style: const TextStyle(
                      color: FitColors.accent,
                      fontSize: 10,
                      letterSpacing: 1.4,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView(
              controller: controller,
              padding: const EdgeInsets.fromLTRB(22, 22, 22, 42),
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 27,
                    height: 1.28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                if (meta != null && meta.trim().isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: const BoxDecoration(
                      border: Border.symmetric(
                        horizontal: BorderSide(color: FitColors.line),
                      ),
                    ),
                    child: Text(
                      meta,
                      style: const TextStyle(
                        color: FitColors.accent,
                        fontSize: 12,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                Text(
                  body.trim().isEmpty ? '暂无补充说明。' : body,
                  style: const TextStyle(
                    color: Color(0xFFC4CCC8),
                    fontSize: 14,
                    height: 1.7,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

String textOf(Map<String, dynamic> item, String key) =>
    item[key]?.toString() ?? '';

List<Map<String, dynamic>> mapsOf(dynamic value) =>
    (value as List<dynamic>? ?? const []).cast<Map<String, dynamic>>();

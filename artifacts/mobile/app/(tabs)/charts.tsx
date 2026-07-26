import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSimulation } from '@/contexts/SimulationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SimBadge } from '@/components/SimBadge';
import Svg, { Line, Circle, Rect, Text as SvgText, Path } from 'react-native-svg';

export default function ChartsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { simState, investments } = useSimulation();

  const chartWidth = 300;
  const chartHeight = 180;

  // Generate data for egg production
  const eggData = Array.from({ length: Math.min(simState.simulationDay + 1, 20) }, (_, i) => ({
    day: i,
    eggs: Math.min(i * 30 + Math.random() * 20, 400),
  }));

  // Generate data for investor growth
  const investorData = Array.from({ length: Math.min(simState.simulationDay + 1, 20) }, (_, i) => {
    let base = 847;
    if (i <= 5) base *= 1 + i * 0.15;
    else if (i <= 10) base *= 1 + 5 * 0.15 + (i - 5) * 0.05;
    else if (i <= 15) base *= 1 + 5 * 0.15 + 5 * 0.05 + (i - 10) * 0.01;
    return { day: i, investors: Math.floor(base) };
  });

  const maxEggs = Math.max(...eggData.map(d => d.eggs), 100);
  const maxInvestors = Math.max(...investorData.map(d => d.investors), 1000);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'web' ? 67 + 20 : insets.top + 20 },
          { paddingBottom: Platform.OS === 'web' ? 84 + 20 : insets.bottom + 84 + 20 },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Analytics</Text>
          <SimBadge size="sm" />
        </View>

        {/* Egg Production Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Egg Production Over Time</Text>
          <Svg width={chartWidth} height={chartHeight}>
            {/* Axes */}
            <Line x1="30" y1="10" x2="30" y2={chartHeight - 30} stroke={colors.border} strokeWidth="2" />
            <Line x1="30" y1={chartHeight - 30} x2={chartWidth - 10} y2={chartHeight - 30} stroke={colors.border} strokeWidth="2" />
            
            {/* Line chart */}
            {eggData.length > 1 && (
              <Path
                d={eggData
                  .map((d, i) => {
                    const x = 30 + ((chartWidth - 40) / (eggData.length - 1)) * i;
                    const y = chartHeight - 30 - ((chartHeight - 40) / maxEggs) * d.eggs;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                stroke={colors.primary}
                strokeWidth="3"
                fill="none"
              />
            )}
            
            {/* Points */}
            {eggData.map((d, i) => {
              const x = 30 + ((chartWidth - 40) / Math.max(eggData.length - 1, 1)) * i;
              const y = chartHeight - 30 - ((chartHeight - 40) / maxEggs) * d.eggs;
              return <Circle key={i} cx={x} cy={y} r="4" fill={colors.primary} />;
            })}
          </Svg>
          <Text style={[styles.chartLabel, { color: colors.mutedForeground }]}>Days in simulation</Text>
        </View>

        {/* Investor Growth Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Investor Growth Over Time</Text>
          <Svg width={chartWidth} height={chartHeight}>
            {/* Axes */}
            <Line x1="30" y1="10" x2="30" y2={chartHeight - 30} stroke={colors.border} strokeWidth="2" />
            <Line x1="30" y1={chartHeight - 30} x2={chartWidth - 10} y2={chartHeight - 30} stroke={colors.border} strokeWidth="2" />
            
            {/* Bars */}
            {investorData.map((d, i) => {
              const barWidth = Math.max((chartWidth - 40) / investorData.length - 4, 8);
              const x = 30 + ((chartWidth - 40) / investorData.length) * i + 2;
              const barHeight = ((chartHeight - 40) / maxInvestors) * d.investors;
              const y = chartHeight - 30 - barHeight;
              return <Rect key={i} x={x} y={y} width={barWidth} height={barHeight} fill={colors.accent} />;
            })}
          </Svg>
          <Text style={[styles.chartLabel, { color: colors.mutedForeground }]}>Growth slows, then stalls, then collapses</Text>
        </View>

        {/* Collapse Timeline */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Collapse Timeline</Text>
          <View style={styles.timeline}>
            {[
              { label: 'Launch', color: colors.primary, day: 0 },
              { label: 'Peak Investors', color: colors.warning, day: 5 },
              { label: 'Growth Stalls', color: '#FF8C00', day: 10 },
              { label: 'Payouts Stop', color: '#E5484D', day: 15 },
              { label: 'Collapse', color: colors.destructive, day: 16 },
            ].map((phase, i) => (
              <View key={i} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: phase.color }]} />
                {i < 4 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                <Text style={[styles.timelineLabel, { color: colors.foreground }]}>{phase.label}</Text>
                <Text style={[styles.timelineDay, { color: colors.mutedForeground }]}>Day {phase.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Cash Flow */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Cash Flow Visualization</Text>
          <View style={styles.flowContainer}>
            <View style={[styles.flowBox, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
              <Text style={[styles.flowLabel, { color: colors.primary }]}>New Investors</Text>
            </View>
            <View style={styles.flowArrow}>
              <View style={[styles.arrowLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.arrowLabel, { color: colors.foreground }]}>Money Flow</Text>
            </View>
            <View style={[styles.flowBox, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}>
              <Text style={[styles.flowLabel, { color: colors.accent }]}>Existing Investors</Text>
              <Text style={[styles.flowSubLabel, { color: colors.mutedForeground }]}>(Payouts)</Text>
            </View>
          </View>
          <View style={[styles.warningBox, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive }]}>
            <Text style={[styles.warningText, { color: colors.destructive }]}>
              No real product or service generates this return
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  chartLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  timeline: {
    width: '100%',
    paddingVertical: 10,
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 40,
    paddingBottom: 20,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 16,
    width: 2,
    height: 20,
  },
  timelineLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  timelineDay: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  flowContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  flowBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  flowLabel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  flowSubLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  flowArrow: {
    alignItems: 'center',
    gap: 4,
  },
  arrowLine: {
    width: 2,
    height: 24,
  },
  arrowLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  warningBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
});

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../utils/theme';
import { useFunds } from '../context/FundsContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- DUAL SEGMENT PROGRESS DONUT CHART ---
interface DonutChartProps {
  paid: number;
  pending: number;
  total: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ paid, pending, total }) => {
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;
  const pendingPercent = total > 0 ? Math.round((pending / total) * 100) : 0;

  return (
    <View style={[styles.card, { backgroundColor: activeColors.surfaceCard, borderColor: activeColors.border }]}>
      <Text style={[styles.cardTitle, { color: activeColors.textSecondary }]}>Payment Allocation</Text>
      
      <View style={styles.donutContainer}>
        {/* Ring Graphic using Nesting */}
        <View style={[styles.outerRing, { backgroundColor: activeColors.border }]}>
          {/* Main glowing track */}
          <View style={[styles.fillSector, { 
            backgroundColor: activeColors.success, 
            height: `${paidPercent}%`, 
            width: `${paidPercent}%`,
            borderRadius: BORDER_RADIUS.round
          }]} />
          
          <View style={[styles.innerRing, { backgroundColor: activeColors.surfaceCard }]}>
            <Text style={[styles.centerPercent, { color: activeColors.text }]}>{paidPercent}%</Text>
            <Text style={[styles.centerSub, { color: activeColors.textSecondary }]}>Collected</Text>
          </View>
        </View>

        {/* Legend Grid */}
        <View style={styles.legendGrid}>
          <View style={styles.legendRow}>
            <View style={[styles.colorDot, { backgroundColor: activeColors.success }]} />
            <View>
              <Text style={[styles.legendLabel, { color: activeColors.textSecondary }]}>Collected</Text>
              <Text style={[styles.legendVal, { color: activeColors.text }]}>₹{paid.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={styles.legendRow}>
            <View style={[styles.colorDot, { backgroundColor: activeColors.warning }]} />
            <View>
              <Text style={[styles.legendLabel, { color: activeColors.textSecondary }]}>Outstanding</Text>
              <Text style={[styles.legendVal, { color: activeColors.text }]}>₹{pending.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// --- MULTI-COLUMN TREND BAR CHART ---
interface BarChartProps {
  data: { label: string; value: number }[];
  maxVal?: number;
}

export const CollectionBarChart: React.FC<BarChartProps> = ({ data, maxVal }) => {
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;

  const values = data.map((d) => d.value);
  const highestValue = maxVal || Math.max(...values, 1000);

  return (
    <View style={[styles.card, { backgroundColor: activeColors.surfaceCard, borderColor: activeColors.border }]}>
      <Text style={[styles.cardTitle, { color: activeColors.textSecondary }]}>Monthly Cash Collection Trend</Text>
      
      <View style={styles.chartWrapper}>
        {/* Y Axis Gridlines */}
        <View style={styles.gridLinesContainer}>
          {[0.25, 0.5, 0.75, 1.0].reverse().map((ratio, idx) => (
            <View key={idx} style={[styles.gridLineRow, { borderBottomColor: activeColors.border }]}>
              <Text style={[styles.gridLabel, { color: activeColors.textMuted }]}>
                ₹{Math.round((highestValue * ratio) / 1000)}k
              </Text>
            </View>
          ))}
        </View>

        {/* The Bars Area */}
        <View style={styles.barsContainer}>
          {data.map((item, idx) => {
            const pct = Math.min((item.value / highestValue) * 100, 100);
            
            return (
              <View key={idx} style={styles.columnWrapper}>
                <View style={styles.columnContainer}>
                  {/* Glowing Bar Column */}
                  <View style={[styles.barTrack, { backgroundColor: isDarkMode ? '#1E293B' : '#E5E7EB' }]}>
                    <View style={[styles.barFill, { 
                      backgroundColor: activeColors.primary, 
                      height: `${pct}%`,
                      borderTopLeftRadius: BORDER_RADIUS.xs,
                      borderTopRightRadius: BORDER_RADIUS.xs,
                    }]} />
                  </View>
                  {/* Amount Badge on Top */}
                  {item.value > 0 && (
                    <Text style={[styles.barValueLabel, { color: activeColors.text }]}>
                      ₹{Math.round(item.value / 1000)}k
                    </Text>
                  )}
                </View>
                {/* X Axis Label */}
                <Text style={[styles.xAxisLabel, { color: activeColors.textSecondary }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// --- PREMIUM PROGRESS BAR ---
interface ProgressBarProps {
  progress: number; // between 0 and 1
  height?: number;
  showText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, height = 8, showText = false }) => {
  const { isDarkMode } = useFunds();
  const activeColors = isDarkMode ? COLORS.dark : COLORS.light;
  
  const displayProgress = Math.min(Math.max(progress, 0), 1);
  const percentText = `${Math.round(displayProgress * 100)}%`;

  return (
    <View style={styles.progressContainer}>
      {showText && (
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: activeColors.textSecondary }]}>Timeline Completion</Text>
          <Text style={[styles.progressVal, { color: activeColors.primary }]}>{percentText}</Text>
        </View>
      )}
      <View style={[styles.trackLine, { height, backgroundColor: isDarkMode ? '#1E293B' : '#E5E7EB', borderRadius: height / 2 }]}>
        <View style={[styles.fillLine, { 
          height, 
          width: `${displayProgress * 100}%`, 
          backgroundColor: activeColors.primary, 
          borderRadius: height / 2 
        }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginVertical: SPACING.sm,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.xs,
  },
  outerRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  fillSector: {
    position: 'absolute',
    opacity: 0.85,
  },
  innerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  centerPercent: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: 'bold',
  },
  centerSub: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  legendGrid: {
    flex: 1,
    paddingLeft: SPACING.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  legendVal: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  chartWrapper: {
    height: 160,
    flexDirection: 'row',
    position: 'relative',
  },
  gridLinesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 20,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  gridLineRow: {
    borderBottomWidth: 0.8,
    borderStyle: 'dashed',
    width: '100%',
    height: 1,
    alignItems: 'flex-start',
  },
  gridLabel: {
    fontSize: 9,
    position: 'absolute',
    top: -12,
    left: 0,
    fontWeight: '600',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 32, // space for Y axis labels
    zIndex: 2,
  },
  columnWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  columnContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  barTrack: {
    width: 14,
    height: '80%',
    borderRadius: BORDER_RADIUS.xs,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
  },
  barValueLabel: {
    fontSize: 8,
    fontWeight: '700',
    position: 'absolute',
    bottom: '82%',
    textAlign: 'center',
  },
  xAxisLabel: {
    fontSize: 9,
    marginTop: 6,
    fontWeight: '600',
    width: '100%',
    textAlign: 'center',
  },
  progressContainer: {
    marginVertical: SPACING.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.size.xs,
  },
  progressVal: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
  },
  trackLine: {
    width: '100%',
    overflow: 'hidden',
  },
  fillLine: {
    height: '100%',
  },
});

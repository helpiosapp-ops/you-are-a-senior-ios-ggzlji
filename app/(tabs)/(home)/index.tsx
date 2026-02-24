
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { HeaderRightButton, HeaderLeftButton } from "@/components/HeaderButtons";
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { IconSymbol } from "@/components/IconSymbol";

interface DeviceHealthData {
  battery: {
    level: number;
    state: string;
    lowPowerMode: boolean;
  };
  device: {
    osName: string;
    osVersion: string;
    modelName: string;
    totalMemory: number;
    deviceYearClass: number | null;
  };
  network: {
    isConnected: boolean;
    isInternetReachable: boolean;
    type: string;
  };
  recommendations: string[];
  healthScore: number;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 8,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  scoreDescription: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    marginBottom: 25,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  metricLabel: {
    fontSize: 15,
    opacity: 0.7,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  explanation: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    marginTop: 8,
  },
  recommendationsSection: {
    marginBottom: 25,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 10,
  },
  exportButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    opacity: 0.7,
  },
});

export default function HomeScreen() {
  const { colors } = useTheme();
  const [healthData, setHealthData] = useState<DeviceHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    console.log('SilentAudit: Starting device health scan');
    gatherDeviceHealth();
  }, []);

  const gatherDeviceHealth = async () => {
    console.log('SilentAudit: Gathering device health data');
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();
      const lowPowerMode = await Battery.isLowPowerModeEnabledAsync();
      
      const networkState = await Network.getNetworkStateAsync();
      
      const recommendations: string[] = [];
      
      if (batteryLevel < 0.2 && batteryState !== Battery.BatteryState.CHARGING) {
        recommendations.push('Your battery is running low. Consider charging your device soon to avoid unexpected shutdowns.');
      }
      
      if (lowPowerMode) {
        recommendations.push('Low Power Mode is enabled. This helps extend battery life by reducing background activity and visual effects.');
      } else if (batteryLevel < 0.5) {
        recommendations.push('Consider enabling Low Power Mode to extend battery life. Go to Settings > Battery > Low Power Mode.');
      }
      
      if (!networkState.isInternetReachable) {
        recommendations.push('No internet connection detected. Check your Wi-Fi or cellular data settings.');
      }
      
      if (Device.totalMemory && Device.totalMemory < 2 * 1024 * 1024 * 1024) {
        recommendations.push('Your device has limited memory. Close unused apps to improve performance.');
      }
      
      if (recommendations.length === 0) {
        recommendations.push('Your device is in good health! All systems are functioning normally.');
      }
      
      let healthScore = 100;
      if (batteryLevel < 0.2) healthScore -= 20;
      if (lowPowerMode) healthScore -= 5;
      if (!networkState.isInternetReachable) healthScore -= 15;
      if (batteryState === Battery.BatteryState.UNKNOWN) healthScore -= 10;
      
      const batteryStateText = getBatteryStateText(batteryState);
      const networkTypeText = getNetworkTypeText(networkState.type);
      
      const data: DeviceHealthData = {
        battery: {
          level: batteryLevel,
          state: batteryStateText,
          lowPowerMode,
        },
        device: {
          osName: Device.osName || 'Unknown',
          osVersion: Device.osVersion || 'Unknown',
          modelName: Device.modelName || 'Unknown',
          totalMemory: Device.totalMemory || 0,
          deviceYearClass: Device.deviceYearClass,
        },
        network: {
          isConnected: networkState.isConnected || false,
          isInternetReachable: networkState.isInternetReachable || false,
          type: networkTypeText,
        },
        recommendations,
        healthScore,
      };
      
      console.log('SilentAudit: Device health data gathered', data);
      setHealthData(data);
    } catch (error) {
      console.error('SilentAudit: Error gathering device health', error);
    } finally {
      setLoading(false);
    }
  };

  const getBatteryStateText = (state: Battery.BatteryState): string => {
    switch (state) {
      case Battery.BatteryState.CHARGING:
        return 'Charging';
      case Battery.BatteryState.FULL:
        return 'Full';
      case Battery.BatteryState.UNPLUGGED:
        return 'Unplugged';
      default:
        return 'Unknown';
    }
  };

  const getNetworkTypeText = (type: string | undefined): string => {
    if (!type) return 'Unknown';
    switch (type) {
      case 'WIFI':
        return 'Wi-Fi';
      case 'CELLULAR':
        return 'Cellular';
      case 'ETHERNET':
        return 'Ethernet';
      case 'NONE':
        return 'No Connection';
      default:
        return type;
    }
  };

  const formatMemory = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 90) return '#34C759';
    if (score >= 70) return '#FF9500';
    return '#FF3B30';
  };

  const getHealthScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    return 'Needs Attention';
  };

  const generatePDFReport = async () => {
    if (!healthData) return;
    
    console.log('SilentAudit: Generating PDF report');
    setExporting(true);
    
    try {
      const date = new Date().toLocaleDateString();
      const batteryPercentage = Math.round(healthData.battery.level * 100);
      
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                padding: 40px;
                color: #333;
              }
              h1 {
                color: #007AFF;
                font-size: 32px;
                margin-bottom: 10px;
              }
              .subtitle {
                color: #666;
                font-size: 14px;
                margin-bottom: 30px;
              }
              .score-section {
                background: #f5f5f5;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                margin-bottom: 30px;
              }
              .score {
                font-size: 64px;
                font-weight: bold;
                color: ${getHealthScoreColor(healthData.healthScore)};
              }
              .score-label {
                font-size: 24px;
                color: #666;
                margin-top: 10px;
              }
              .section {
                margin-bottom: 30px;
              }
              .section-title {
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 15px;
                color: #007AFF;
              }
              .metric {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
              }
              .metric-label {
                color: #666;
              }
              .metric-value {
                font-weight: 600;
              }
              .recommendation {
                background: #f9f9f9;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
                border-left: 4px solid #007AFF;
              }
              .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                color: #999;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <h1>SilentAudit Device Health Report</h1>
            <div class="subtitle">Generated on ${date}</div>
            
            <div class="score-section">
              <div class="score">${healthData.healthScore}</div>
              <div class="score-label">${getHealthScoreLabel(healthData.healthScore)}</div>
            </div>
            
            <div class="section">
              <div class="section-title">Battery Health</div>
              <div class="metric">
                <span class="metric-label">Battery Level</span>
                <span class="metric-value">${batteryPercentage}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Charging State</span>
                <span class="metric-value">${healthData.battery.state}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Low Power Mode</span>
                <span class="metric-value">${healthData.battery.lowPowerMode ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Device Information</div>
              <div class="metric">
                <span class="metric-label">Operating System</span>
                <span class="metric-value">${healthData.device.osName} ${healthData.device.osVersion}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Model</span>
                <span class="metric-value">${healthData.device.modelName}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Total Memory</span>
                <span class="metric-value">${formatMemory(healthData.device.totalMemory)}</span>
              </div>
              ${healthData.device.deviceYearClass ? `
              <div class="metric">
                <span class="metric-label">Device Year Class</span>
                <span class="metric-value">${healthData.device.deviceYearClass}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="section">
              <div class="section-title">Network Status</div>
              <div class="metric">
                <span class="metric-label">Connection Type</span>
                <span class="metric-value">${healthData.network.type}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Internet Reachable</span>
                <span class="metric-value">${healthData.network.isInternetReachable ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Recommendations</div>
              ${healthData.recommendations.map(rec => `
                <div class="recommendation">${rec}</div>
              `).join('')}
            </div>
            
            <div class="footer">
              <p>SilentAudit - Privacy-First Device Health</p>
              <p>This report was generated locally on your device. No data was sent to any server.</p>
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html });
      console.log('SilentAudit: PDF generated at', uri);
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      console.log('SilentAudit: PDF shared successfully');
    } catch (error) {
      console.error('SilentAudit: Error generating PDF', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "SilentAudit",
            headerLeft: () => <HeaderLeftButton />,
            headerRight: () => <HeaderRightButton />,
          }}
        />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Scanning device health...
          </Text>
        </View>
      </>
    );
  }

  if (!healthData) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "SilentAudit",
            headerLeft: () => <HeaderLeftButton />,
            headerRight: () => <HeaderRightButton />,
          }}
        />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Unable to load device health data
          </Text>
        </View>
      </>
    );
  }

  const batteryPercentage = Math.round(healthData.battery.level * 100);
  const healthScoreColor = getHealthScoreColor(healthData.healthScore);
  const healthScoreLabel = getHealthScoreLabel(healthData.healthScore);

  return (
    <>
      <Stack.Screen
        options={{
          title: "SilentAudit",
          headerLeft: () => <HeaderLeftButton />,
          headerRight: () => <HeaderRightButton />,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Device Health</Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Privacy-first insights about your device
            </Text>
          </View>

          <View style={[styles.scoreContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.scoreCircle, { borderColor: healthScoreColor }]}>
              <Text style={[styles.scoreText, { color: healthScoreColor }]}>
                {healthData.healthScore}
              </Text>
            </View>
            <Text style={[styles.scoreLabel, { color: colors.text }]}>
              {healthScoreLabel}
            </Text>
            <Text style={[styles.scoreDescription, { color: colors.text }]}>
              Overall health score based on battery, network, and device status
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol 
                ios_icon_name="battery.100" 
                android_material_icon_name="battery-full" 
                size={24} 
                color={colors.text} 
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Battery</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>Level</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {batteryPercentage}%
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>State</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {healthData.battery.state}
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>Low Power Mode</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {healthData.battery.lowPowerMode ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            
            <Text style={[styles.explanation, { color: colors.text }]}>
              Your battery is currently at {batteryPercentage}%. 
              {healthData.battery.state === 'Charging' 
                ? ' Your device is charging and will reach full capacity soon.' 
                : healthData.battery.lowPowerMode 
                  ? ' Low Power Mode is helping extend your battery life by reducing background activity.' 
                  : ' Monitor your battery usage to ensure optimal performance throughout the day.'}
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol 
                ios_icon_name="iphone" 
                android_material_icon_name="phone-android" 
                size={24} 
                color={colors.text} 
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Device</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>Model</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {healthData.device.modelName}
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>OS</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {healthData.device.osName} {healthData.device.osVersion}
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>Memory</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {formatMemory(healthData.device.totalMemory)}
              </Text>
            </View>
            
            {healthData.device.deviceYearClass && (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: colors.text }]}>Year Class</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {healthData.device.deviceYearClass}
                </Text>
              </View>
            )}
            
            <Text style={[styles.explanation, { color: colors.text }]}>
              Your {healthData.device.modelName} is running {healthData.device.osName} {healthData.device.osVersion}. 
              {healthData.device.deviceYearClass 
                ? ` This device is from the ${healthData.device.deviceYearClass} year class, indicating its performance capabilities.` 
                : ' Keep your device updated for the best security and performance.'}
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol 
                ios_icon_name="wifi" 
                android_material_icon_name="wifi" 
                size={24} 
                color={colors.text} 
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Network</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>Type</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {healthData.network.type}
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>Connected</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {healthData.network.isConnected ? 'Yes' : 'No'}
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.text }]}>Internet</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {healthData.network.isInternetReachable ? 'Reachable' : 'Unreachable'}
              </Text>
            </View>
            
            <Text style={[styles.explanation, { color: colors.text }]}>
              {healthData.network.isInternetReachable 
                ? `You're connected via ${healthData.network.type} with internet access. Your connection is stable and ready for use.` 
                : 'No internet connection detected. Check your Wi-Fi or cellular settings to restore connectivity.'}
            </Text>
          </View>

          <View style={[styles.recommendationsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol 
                ios_icon_name="lightbulb" 
                android_material_icon_name="lightbulb" 
                size={24} 
                color={colors.text} 
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommendations</Text>
            </View>
            
            {healthData.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle" 
                  android_material_icon_name="check-circle" 
                  size={20} 
                  color="#007AFF" 
                />
                <Text style={[styles.recommendationText, { color: colors.text }]}>
                  {recommendation}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: '#007AFF' }]}
          onPress={generatePDFReport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol 
                ios_icon_name="square.and.arrow.up" 
                android_material_icon_name="share" 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={[styles.exportButtonText, { color: '#FFFFFF' }]}>
                Export Health Report
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

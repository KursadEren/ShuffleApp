import { useState } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

const List = ({
  data,
  renderItem,
  keyExtractor,
  onItemPress,
  onRefresh,
  onEndReached,
  loading = false,
  refreshing = false,
  emptyText = 'Veri bulunamadi',
  emptyIcon = '📭',
  showSeparator = true,
  headerComponent,
  footerComponent,
}) => {

  const defaultKeyExtractor = (item, index) => {
    return item.id ? item.id.toString() : index.toString();
  };

  const defaultRenderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onItemPress && onItemPress(item, index)}
      activeOpacity={0.7}>
      <View style={styles.itemContent}>
        {item.icon && <Text style={styles.itemIcon}>{item.icon}</Text>}
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title || item.name || 'Baslik yok'}
          </Text>
          {item.subtitle && (
            <Text style={styles.itemSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
        </View>
        {item.rightText && (
          <Text style={styles.itemRightText}>{item.rightText}</Text>
        )}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSeparator = () => {
    if (!showSeparator) return null;
    return <View style={styles.separator} />;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{emptyIcon}</Text>
      <Text style={styles.emptyText}>{emptyText}</Text>
    </View>
  );

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#6C63FF" />
        </View>
      );
    }
    return footerComponent || null;
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem || defaultRenderItem}
      keyExtractor={keyExtractor || defaultKeyExtractor}
      ItemSeparatorComponent={renderSeparator}
      ListEmptyComponent={renderEmpty}
      ListHeaderComponent={headerComponent}
      ListFooterComponent={renderFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={data?.length === 0 && styles.emptyList}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6C63FF']}
            tintColor="#6C63FF"
          />
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  itemRightText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default List;

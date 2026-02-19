import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const MessageReactions = ({ reactions, onReactionPress, isOwnMessage }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <View style={[styles.container, isOwnMessage && styles.containerRight]}>
      {reactions.map((reaction) => (
        <TouchableOpacity
          key={reaction.emoji}
          style={[
            styles.reactionBadge,
            reaction.hasReacted && styles.reactionBadgeActive,
          ]}
          onPress={() => onReactionPress(reaction.emoji, reaction.hasReacted)}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{reaction.emoji}</Text>
          <Text
            style={[
              styles.count,
              reaction.hasReacted && styles.countActive,
            ]}
          >
            {reaction.count}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  containerRight: {
    alignSelf: 'flex-end',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  reactionBadgeActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  countActive: {
    color: '#6C63FF',
  },
});

export default MessageReactions;

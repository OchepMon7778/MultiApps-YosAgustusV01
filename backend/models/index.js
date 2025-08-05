const User = require('./User');
const Chat = require('./Chat');

// Associations
User.hasMany(Chat, { foreignKey: 'sender_id', as: 'sentMessages' });
User.hasMany(Chat, { foreignKey: 'receiver_id', as: 'receivedMessages' });
Chat.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Chat.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

module.exports = {
  User,
  Chat
};
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  preferences: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
export const User = mongoose.model('User', UserSchema);

const RoomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, maxlength: 6 },
  type: { type: String, enum: ['p2p', 'group'], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  preserveHistory: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
export const Room = mongoose.model('Room', RoomSchema);

const RoomMemberSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestId: { type: String },
  displayName: { type: String },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
});
export const RoomMember = mongoose.model('RoomMember', RoomMemberSchema);

const MessageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestId: { type: String },
  content: { type: String, required: true },
  messageType: { type: String, default: 'text' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });
export const Message = mongoose.model('Message', MessageSchema);

const GuestSessionSchema = new mongoose.Schema({
  sessionToken: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  currentRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});
export const GuestSession = mongoose.model('GuestSession', GuestSessionSchema);
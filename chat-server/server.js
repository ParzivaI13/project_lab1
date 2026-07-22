const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost", // Ваш XAMPP
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Підключення до MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/student_chat");
    console.log("✅ Підключено до MongoDB");
  } catch (error) {
    console.error("❌ Помилка підключення до MongoDB:", error);
    process.exit(1);
  }
};

// Модель для повідомлень
const messageSchema = new mongoose.Schema({
  sender_id: { type: String, required: true },
  sender_name: { type: String, required: true },
  recipient_id: { type: String },
  group_id: { type: String },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

const Message = mongoose.model("Message", messageSchema);

const groupChatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  participants: [{ type: String, required: true }],
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  last_message: { type: Date, default: Date.now },
});

const GroupChat = mongoose.model("GroupChat", groupChatSchema);

app.use(
  cors({
    origin: "http://localhost",
    credentials: true,
  })
);
app.use(express.json());

// API для отримання історії повідомлень між двома користувачами
app.get("/api/messages/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    console.log(`📥 Запит історії повідомлень між ${user1} та ${user2}`);

    const messages = await Message.find({
      $or: [
        { sender_id: user1, recipient_id: user2 },
        { sender_id: user2, recipient_id: user1 },
      ],
    })
      .sort({ timestamp: 1 })
      .limit(50);

    console.log(`📤 Знайдено ${messages.length} повідомлень`);
    res.json(messages);
  } catch (error) {
    console.error("❌ Помилка отримання повідомлень:", error);
    res.status(500).json({ error: error.message });
  }
});

// Тестовий роут для перевірки з'єднання
app.get("/test", (req, res) => {
  res.json({ status: "OK", message: "Чат-сервер працює" });
});

app.get("/api/group-chats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const groupChats = await GroupChat.find({
      participants: userId,
    }).sort({ last_message: -1 });
    res.json(groupChats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/group-chats", async (req, res) => {
  try {
    const { name, participants, created_by } = req.body;
    const newGroupChat = new GroupChat({
      name,
      participants: [...new Set(participants)], // унікальні учасники
      created_by,
    });
    await newGroupChat.save();
    res.json(newGroupChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/group-messages/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await Message.find({ group_id: groupId })
      .sort({ timestamp: 1 })
      .limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io для реального часу
io.on("connection", (socket) => {
  console.log("👤 Користувач підключився:", socket.id);

  // Приєднання до персональної кімнати користувача
  socket.on("join_user_room", (userId) => {
    socket.join(userId);
    console.log(`🏠 Користувач ${userId} приєднався до своєї кімнати`);
  });

  // Отримання нового повідомлення
  socket.on("send_message", async (data) => {
    try {
      console.log("📨 Отримано повідомлення:", data);

      if (!data.sender_id || !data.message || !data.sender_name) {
        console.error("❌ Неповні дані повідомлення");
        socket.emit("error", "Неповні дані повідомлення");
        return;
      }

      const newMessage = new Message({
        sender_id: data.sender_id,
        sender_name: data.sender_name,
        recipient_id: data.recipient_id || null,
        group_id: data.group_id || null,
        message: data.message.trim(),
      });

      await newMessage.save();
      console.log("💾 Повідомлення збережено:", newMessage._id);

      // Відправка повідомлення відправнику
      socket.emit("message_sent", newMessage);

      if (data.group_id) {
        // Для групового чату - відправити всім учасникам
        const groupChat = await GroupChat.findById(data.group_id);
        if (groupChat) {
          groupChat.participants.forEach((participantId) => {
            if (participantId !== data.sender_id) {
              socket.to(participantId).emit("receive_message", newMessage);
            }
          });
          // Оновити час останнього повідомлення
          groupChat.last_message = new Date();
          await groupChat.save();
        }
      } else if (data.recipient_id) {
        // Для приватного чату
        socket.to(data.recipient_id).emit("receive_message", newMessage);
      }
    } catch (error) {
      console.error("❌ Помилка збереження повідомлення:", error);
      socket.emit("error", "Помилка відправки повідомлення");
    }
  });

  socket.on("disconnect", () => {
    console.log("👋 Користувач відключився:", socket.id);
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Чат-сервер запущено на порту ${PORT}`);
    console.log(`🌐 CORS налаштовано для: http://localhost`);
  });
};

startServer();

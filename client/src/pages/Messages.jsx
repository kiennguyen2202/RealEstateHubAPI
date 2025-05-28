import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosPrivate from "../api/axiosPrivate";
import { useAuth } from "../auth/AuthContext";

function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchConversations = async () => {
      try {
        const response = await axiosPrivate.get("/api/conversations");
        setConversations(response.data);
      } catch (err) {
        setError("Không thể tải danh sách cuộc trò chuyện");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          const response = await axiosPrivate.get(`/api/conversations/${selectedConversation.id}/messages`);
          setMessages(response.data);
        } catch (err) {
          console.error("Error fetching messages:", err);
        }
      };

      fetchMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await axiosPrivate.post(`/api/conversations/${selectedConversation.id}/messages`, {
        content: newMessage
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Không thể gửi tin nhắn");
    }
  };

  const handleStartConversation = async (userId) => {
    try {
      const response = await axiosPrivate.post("/api/conversations", {
        userId
      });

      setConversations(prev => [...prev, response.data]);
      setSelectedConversation(response.data);
    } catch (err) {
      console.error("Error starting conversation:", err);
      alert("Không thể bắt đầu cuộc trò chuyện");
    }
  };

  if (loading) return <div className="text-center p-4">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Danh sách cuộc trò chuyện */}
            <div className="border-r">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Tin nhắn</h2>
              </div>
              <div className="overflow-y-auto h-[calc(100%-4rem)]">
                {conversations.map(conversation => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {conversation.participant?.name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{conversation.participant?.name}</h3>
                        <p className="text-sm text-gray-500">
                          {conversation.lastMessage?.content || "Chưa có tin nhắn"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Khu vực chat */}
            <div className="md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">{selectedConversation.participant?.name}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === user.id
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(message.created).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Nhập tin nhắn..."
                      />
                      <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        Gửi
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Chọn một cuộc trò chuyện để bắt đầu
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages; 
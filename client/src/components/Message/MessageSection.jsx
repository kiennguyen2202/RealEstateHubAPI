import React, { useState, useEffect } from 'react';
import { messageService } from '../../api/messageService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../../auth/AuthContext';

const MessageSection = ({ postId, postTitle, receiverId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                const data = await messageService.getPostMessages(postId);
                setMessages(data);
                setError(null);
            } catch (err) {
                setError('Không thể tải tin nhắn. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
        // Cập nhật tin nhắn mỗi 5 giây
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [postId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            const messageData = {
                senderId: user.id,
                receiverId: receiverId,
                postId: postId,
                content: newMessage.trim()
            };

            await messageService.sendMessage(messageData);
            setNewMessage('');
            // Cập nhật lại danh sách tin nhắn
            const updatedMessages = await messageService.getPostMessages(postId);
            setMessages(updatedMessages);
        } catch (err) {
            setError('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
        }
    };

    if (!user) {
        return (
            <div className="bg-white rounded-lg shadow-md p-4 mt-4">
                <p className="text-center text-gray-600">
                    Vui lòng <a href="/login" className="text-blue-500 hover:underline">đăng nhập</a> để nhắn tin
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mt-4">
            <h3 className="text-lg font-semibold mb-4">Tin nhắn về bài đăng</h3>
            
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
            
            <div className="h-[300px] overflow-y-auto mb-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <p>Đang tải tin nhắn...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">Chưa có tin nhắn nào</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${
                                message.senderId === user.id ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                    message.senderId === user.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-800'
                                }`}
                            >
                                <div className="text-sm font-semibold mb-1">
                                    {message.senderId === user.id ? 'Bạn' : message.senderName}
                                </div>
                                <div className="text-sm">{message.content}</div>
                                <div className="text-xs mt-1 opacity-70">
                                    {format(new Date(message.sentTime), 'HH:mm dd/MM/yyyy', {
                                        locale: vi,
                                    })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`px-4 py-2 rounded-lg text-white font-medium ${
                        !newMessage.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                >
                    Gửi
                </button>
            </form>
        </div>
    );
};

export default MessageSection; 
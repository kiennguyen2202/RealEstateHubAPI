import React, { useEffect, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, ChannelList, MessageInput, Thread, Window, useChatContext, VirtualizedMessageList,
   MessageSimple, useMessageContext } from 'stream-chat-react';
import { useLocation, useNavigate } from 'react-router-dom';
import '@stream-io/stream-chat-css/dist/v2/css/index.css';
import 'stream-chat-react/dist/css/v2/index.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './StreamChatPage.css';
import { useAuth } from '../../auth/AuthContext';
import { formatPrice } from '../../utils/priceUtils';
import { chatService } from '../../api/chatService';
import { postService } from '../../api/postService';

import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';


const StreamChatPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [client, setClient] = useState(null);
  const hasConnectedRef = useRef(false);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (hasConnectedRef.current) return;
    hasConnectedRef.current = true;

    let streamClient;
    (async () => {
      try {
        // Get API key and user token from backend
        const { token, apiKey } = await chatService.getUserToken(user.id, user.name, user.avatarUrl);

        // ensure current user exists on Stream
        try { await chatService.ensureUsers([user.id]); } catch {}

        // Ensure single client instance
        streamClient = clientRef.current ?? StreamChat.getInstance(apiKey);
        if (!clientRef.current) clientRef.current = streamClient;

        // Only connect if not already connected
        if (!streamClient.userID) {
          const normalizedImage = user.avatarUrl
            ? (String(user.avatarUrl).startsWith('http')
                ? user.avatarUrl
                : `http://localhost:5134/${user.avatarUrl}`)
            : undefined;
          await streamClient.connectUser(
            {
              id: String(user.id),
              name: user.name,
              image: normalizedImage,
            },
            token
          );
        }

        setClient(streamClient);
        // Active channel will be chosen from ChannelList
      } catch (err) {
        console.error('Stream init failed', err);
      }
    })();

    return () => {
      (async () => {
        if (clientRef.current) {
          try {
            await clientRef.current.disconnectUser();
          } catch {}
          clientRef.current = null;
          hasConnectedRef.current = false;
        }
      })();
    };
  }, [user]);

  const filters = { type: 'messaging', members: { $in: [String(user.id)] } };
  const sort = { last_message_at: -1 };
  const options = { state: true, watch: true, presence: true };

  if (!user) {
    return <div>Vui lòng đăng nhập để sử dụng chat</div>;
  }
  if (!client) return <div>Đang khởi tạo chat...</div>;

  return (
    <div className="stream-chat-page">
      <Chat client={client} theme="str-chat__theme-light">
        <ChatUI user={user} location={location} filters={filters} sort={sort} options={options} />
      </Chat>
    </div>
  );
};

export default StreamChatPage;

// Custom Post Preview component
const PostPreviewCard = ({ post }) => {
  if (!post) return null;
  
  return (
    <div className="post-preview-card">
      {post.image && (
        <div className="post-preview-image">
          <img src={post.image.startsWith('http') ? post.image : `http://localhost:5134/${post.image}`} alt={post.title} />
        </div>
      )}
      <div className="post-preview-content">
        <h3 className="post-preview-title">{post.title}</h3>
        {post.price !== undefined && post.price !== null && (
          <div className="post-preview-price">{formatPrice(post.price, post.priceUnit)}</div>
        )}
        {post.location && <div className="post-preview-location">{post.location}</div>}
        {post.category && <div className="post-preview-category">{post.category}</div>}
      </div>
    </div>
  );
};

// Custom Message component to show post details
// Provide a custom Avatar to replace Stream's default, preserving all features

const CustomMessageUI = (props) => {
  const { message } = useMessageContext();
  const { user: authUser } = useAuth();
  // Determine participants
  const meId = String(authUser?.id || '');
  const isMine = String(message?.user?.id || '') === meId;
  // Hide message conditionally if marked hidden and user is not viewing hidden ones
  if (message?.hidden && !props?.showHidden) {
    return null;
  }
  return (
    <div className={`custom-message-row ${isMine ? 'me' : 'other'}`}>
      <div className="custom-message-bubble" style={{ width: '100%', position: 'relative' }}>
        <MessageSimple {...props} />
      </div>
    </div>
  );
};

// Custom Channel Preview: compact row for selecting conversations
const CustomChannelPreview = (props) => {
  const { channel, setActiveChannel } = props;
  const { messages } = channel.state;
  const lastMessage = messages[messages.length - 1];
  const data = channel.data || {};
  const [localMeta, setLocalMeta] = useState({});

  // Enrich channel data if missing post owner fields
  useEffect(() => {
    (async () => {
      try {
        if (!data?.postId) return;
        const needsUsername = !data?.postUsername;
        const needsAvatar = !data?.image || typeof data.image !== 'string';
        const needsPrice = data?.price === undefined || data?.priceUnit === undefined;
        const needsPostImage = !data?.postImage;
        if (!(needsUsername || needsAvatar || needsPrice || needsPostImage)) return;
        const post = await postService.getPostById(data.postId);
        if (!post) return;
        const ownerAvatar = post?.user?.avatarUrl ? `http://localhost:5134/${post.user.avatarUrl}` : data?.image;
        const firstImage = Array.isArray(post?.images) && post.images.length > 0 ? `http://localhost:5134${post.images[0].url ?? ''}` : data?.postImage;
        setLocalMeta({
          postUsername: post?.user?.name,
          image: ownerAvatar,
          price: post?.price,
          priceUnit: post?.priceUnit,
          postImage: firstImage,
        });
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel?.cid]);

  // Show post owner's avatar/name 
  // Prefer partner computed from channel members
  const meId = String(useAuth().user?.id || '');
  const memberUsers = Object.values(channel?.state?.members || {}).map(m => m.user).filter(Boolean);
  const partner = memberUsers.find(u => String(u.id) !== meId);
  const displayName = (partner?.name) || localMeta.postUsername || data.postUsername || data.otherUserName || 'Đối tác';
  // Normalize partner avatar to absolute URL
  const partnerImage = localMeta.image || partner?.image || data.otherUserAvatarUrl || data.image;
  const displayAvatar = partnerImage
    ? (String(partnerImage).startsWith('http') ? partnerImage : `http://localhost:5134/${partnerImage.replace(/^\//,'')}`)
    : undefined;
  

  // Unread count for this channel
  let unreadCount = 0;
  try {
    const res = typeof channel.countUnread === 'function' ? channel.countUnread() : 0;
    unreadCount = typeof res === 'number' ? res : (res?.unread ?? 0);
  } catch {}

  return (
    <div
      className="custom-channel-preview"
      onClick={() => setActiveChannel(channel)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') setActiveChannel(channel); }}
    >
      <div className="channel-preview-avatar">
        {displayAvatar ? (
          <img src={displayAvatar} alt={displayName} />
        ) : (
          <div className="avatar-fallback">{displayName?.[0]?.toUpperCase() || 'U'}</div>
        )}
      </div>
      <div className="channel-preview-details">
        <div className="channel-preview-row">
          <span className="channel-preview-name">{displayName}</span>
          <span className="channel-preview-time">
            {lastMessage?.created_at &&
              formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true, locale: vi })}
          </span>
          {unreadCount > 0 && (
            <span className="badge-unread">{unreadCount}</span>
          )}
        </div>
        
      </div>
    </div>
  );
};

// Inner component that can use Chat context
const ChatUI = ({ user, location, filters, sort, options }) => {
  const { client, setActiveChannel, channel: activeChannel } = useChatContext();
  const [quickReplies, setQuickReplies] = useState([]);
  const [postDetails, setPostDetails] = useState({});

  // Toggle between normal and hidden conversations
  const listFilters = React.useMemo(() => ({
    type: 'messaging',
    members: { $in: [String(user.id)] },
  }), [user.id]);

  useEffect(() => {
    setQuickReplies([
      'Căn hộ này còn không ạ?',
      'Tình trạng giấy tờ như thế nào ạ?',
      'Tôi có thể trả góp không?',
      'Giá có thương lượng không ạ?',
    ]);
  }, []);

  // Removed unread polling to reduce queryChannels traffic

  // Auto-open or create a channel from URL params
  const initFromParamsRef = useRef(false);
  useEffect(() => {
    if (!user) return;
            const params = new URLSearchParams(location.search);
        const otherUserId = params.get('u') || params.get('otherUserId');
        if (!otherUserId) return;
        if (!client) return;
        if (initFromParamsRef.current) return;
        initFromParamsRef.current = true;
        (async () => {
          try {
            const postId = params.get('postId');
            let postTitle = params.get('postTitle');
            let image;
            let postImage;
            let postPrice;
            let postPriceUnit;
            let postUsername;
            let otherUserName = params.get('agentName') || params.get('otherUserName');
            let otherUserAvatarUrl;
            const avatarFromParams = params.get('avatar');
            try {
              if (postId && !postTitle) {
                const post = await postService.getPostById(postId);
                postTitle = post?.title || postTitle;
                image = post?.user?.avatarUrl ? `http://localhost:5134/${post.user.avatarUrl}` : avatarFromParams || undefined;
                postImage = Array.isArray(post?.images) && post.images.length > 0 ? `http://localhost:5134${post.images[0].url ?? ''}` : undefined;
                postPrice = post?.price;
                postPriceUnit = post?.priceUnit;
                postUsername = post?.user?.name;
                if (Number(otherUserId) === post?.user?.id) {
                  otherUserName = post?.user?.name;
                  otherUserAvatarUrl = image;
                }
              } else if (avatarFromParams) {
                image = avatarFromParams;
                otherUserAvatarUrl = avatarFromParams;
              }
            } catch {}
        // Ensure both users exist on Stream
        try {
          await chatService.ensureUsers([Number(user.id), Number(otherUserId)]);
        } catch {}
        const memberIds = [String(user.id), String(otherUserId)].sort();

        // 1) Try to find an existing channel for this specific post or agent
        let channel;
        try {
          // Find channel with same members AND same postId (if postId exists)
          const baseFilters = { type: 'messaging', $and: [
            { members: { $in: [String(user.id)] } },
            { members: { $in: [String(otherUserId)] } },
          ] };
          if (postId) {
            baseFilters.$and.push({ postId: Number(postId) });
          }
          const found = await client.queryChannels(baseFilters, { last_message_at: -1 }, { limit: 1, state: true, watch: false });
          if (Array.isArray(found) && found.length > 0) {
            channel = found[0];
            // Lightly enrich metadata if not present yet
            try {
              const dataToSet = {};
              if (postTitle && !channel.data?.postTitle) dataToSet.postTitle = postTitle;
              if (typeof postPrice !== 'undefined' && typeof channel.data?.price === 'undefined') dataToSet.price = postPrice;
              if (typeof postPriceUnit !== 'undefined' && typeof channel.data?.priceUnit === 'undefined') dataToSet.priceUnit = postPriceUnit;
              if (image && !channel.data?.image) dataToSet.image = image;
              if (postImage && !channel.data?.postImage) dataToSet.postImage = postImage;
              if (postUsername && !channel.data?.postUsername) dataToSet.postUsername = postUsername;
              if (otherUserName && !channel.data?.otherUserName) dataToSet.otherUserName = otherUserName;
              if (otherUserAvatarUrl && !channel.data?.otherUserAvatarUrl) dataToSet.otherUserAvatarUrl = otherUserAvatarUrl;
              if (Object.keys(dataToSet).length > 0) await channel.updatePartial({ set: dataToSet });
            } catch {}
          }
        } catch {}

        // 2) Otherwise create a new channel for this specific post or agent
        if (!channel) {
          // Generate a unique channel ID to avoid recreate errors
          const channelId = postId ? `messaging-${postId}-${memberIds.join('-')}` : `messaging-${memberIds.join('-')}-${Date.now()}`;
          channel = client.channel('messaging', channelId, {
            members: memberIds,
            postId: postId || undefined,
            postTitle: postTitle || undefined,
            image,
            postImage: postImage || undefined,
            price: postPrice || undefined,
            priceUnit: postPriceUnit || undefined,
            name: postTitle ? `Tin: ${postTitle}` : undefined,
            postUsername: postUsername || undefined,
            otherUserId: Number(otherUserId),
            otherUserName: otherUserName || undefined,
            otherUserAvatarUrl: otherUserAvatarUrl || undefined,
          });
        }

        try {
          await channel.watch();
        } catch (err) {
          console.error('Open/Create channel failed', err);
        }
        setActiveChannel(channel);
      } catch (e) {
        console.error('Open/Create channel failed', e);
      }
    })();
  }, [client, user, location.search, setActiveChannel]);

  // Fetch post details when channel changes
  useEffect(() => {
    if (!activeChannel) return;
    
    const channelData = activeChannel.data || {};
    const postId = channelData.postId;
    
    if (postId && !postDetails[postId]) {
      (async () => {
        try {
          const postData = await postService.getPostById(postId);
          if (postData) {
            setPostDetails(prev => ({
              ...prev,
              [postId]: {
                title: postData.title,
                price: postData.price,
                image: postData.images && postData.images.length > 0 ? postData.images[0] : null,
                location: postData.location?.name,
                category: postData.category?.name,
                username: postData.user?.name
              }
            }));
          }
        } catch (error) {
          console.error('Error fetching post details:', error);
        }
      })();
    }
  }, [activeChannel, postDetails]);

  return (
    <div className="chat-container">
      <div className="conversation-list">
        <div className="conversation-header">
          <div className="conversation-title">Tin nhắn</div>
        </div>
        <ChannelList
          filters={listFilters}
          sort={sort}
          options={options}
          Preview={(previewProps) => {
            const { channel } = previewProps;
            const [menuOpen, setMenuOpen] = React.useState(false);

            return (
              <div className="channel-preview-container">
                <CustomChannelPreview {...previewProps} channel={channel} setActiveChannel={setActiveChannel} />
              </div>
            );
          }}
        />
      </div>
      <div className="chat-area">
        {activeChannel ? (
          <Channel Message={CustomMessageUI}>
            <Window>
              <CustomHeader />
              <VirtualizedMessageList stickToBottomScrollBehavior="none" Message={CustomMessageUI} />
              <QuickRepliesBar quickReplies={quickReplies} />
              <MessageInput focus={false} />
            </Window>
            <Thread />
          </Channel>
        ) : (
          <div className="empty-chat-placeholder">
            <div className="empty-chat-message">
              Chọn một cuộc hội thoại để bắt đầu chat
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// Custom header with pill preview linking to post detail
const CustomHeader = () => {
  const { channel } = useChatContext();
  const data = channel?.data || {};
  const title = data?.postTitle;
  
  // Compute partner from members to prevent showing self
  const meId = String(useAuth().user?.id || '');
  const memberUsers = Object.values(channel?.state?.members || {}).map(m => m.user).filter(Boolean);
  const partner = memberUsers.find(u => String(u.id) !== meId);
  // Normalize header avatar
  const headerImageRaw = partner?.image || data?.image || data?.otherUserAvatarUrl;
  const image = headerImageRaw ? (String(headerImageRaw).startsWith('http') ? headerImageRaw : `http://localhost:5134/${String(headerImageRaw).replace(/^\//,'')}`) : undefined; // avatar of the other user (post owner)
  const postOwnerName = partner?.name || data?.postUsername || data?.otherUserName || 'Người đăng';
  const priceText = (data?.price !== undefined && data?.priceUnit !== undefined) ? formatPrice(data.price, data.priceUnit) : undefined;
  const navigateTo = useNavigate();
  const goToPost = () => { if (data?.postId) navigateTo(`/chi-tiet/${data.postId}`); };

  // Enrich missing fields (avatar/post image/price) for active channel
  useEffect(() => {
    (async () => {
      try {
        if (!data?.postId) return;
        const needsAvatar = !data?.image && !partner?.image;
        const needsPostImage = !data?.postImage;
        const needsPrice = data?.price === undefined || data?.priceUnit === undefined;
        if (!(needsAvatar || needsPostImage || needsPrice)) return;
        const post = await postService.getPostById(data.postId);
        if (!post) return;
        const ownerAvatar = post?.user?.avatarUrl ? `http://localhost:5134/${post.user.avatarUrl}` : undefined;
        const firstImage = Array.isArray(post?.images) && post.images.length > 0 ? `http://localhost:5134${post.images[0].url ?? ''}` : undefined;
        // Avoid server-side patch (403); just show in header via local variables
        if (ownerAvatar) data.image = data.image || ownerAvatar;
        if (firstImage) data.postImage = data.postImage || firstImage;
        if (data.price === undefined) data.price = post?.price;
        if (data.priceUnit === undefined) data.priceUnit = post?.priceUnit;
        if (!data.postUsername) data.postUsername = post?.user?.name;
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel?.cid]);

  // Clear legacy channel.name (e.g., "Chat với ...") for agent-only chats without postId
  useEffect(() => {
    (async () => {
      try {
        if (!data?.postId && typeof data?.name === 'string' && data.name.length > 0) {
          await channel.updatePartial({ unset: ['name'] });
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel?.cid]);
  return (
    <div className="custom-chat-header">
      {image ? (
        <img src={image} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ddd' }} />
      )}
      <div className="custom-chat-header-details" style={{ marginLeft: 12 }}>
        <div className="custom-chat-header-title">{postOwnerName}</div>
        {title && (
          <div className="custom-chat-header-username">
            {title}
            {priceText ? ` — ${priceText}` : ''}
          </div>
        )}
        
      </div>
              {title && data?.postId && (
          <div className="chat-header-right">
            <div className="post-pill" title={title} onClick={goToPost} style={{ cursor: data?.postId ? 'pointer' : 'default' }}>Xem bài đăng</div>
            <div className="post-popup" onClick={goToPost} style={{ cursor: data?.postId ? 'pointer' : 'default' }}>
              <PostPreviewCard post={{ title, price: data?.price, priceUnit: data?.priceUnit, image: data?.postImage || data?.image, location: data?.location, category: data?.category }} />
            </div>
          </div>
        )}
    </div>
  );
};

// Quick replies bar 
const QuickRepliesBar = ({ quickReplies }) => {
  const { channel } = useChatContext();
  const handleQuickSend = async (text) => {
    if (!channel) return;
    try {
      await channel.sendMessage({ text });
    } catch {}
  };
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderTop: '1px solid #eee', background: 'transparent', overflowX: 'auto' }}>
      {quickReplies.map((qr, idx) => (
        <button
          key={idx}
          style={{ background: '#181818', color: '#fff', border: 'none', borderRadius: 18, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          onClick={() => handleQuickSend(qr)}
          type="button"
        >
          {qr}
        </button>
      ))}
    </div>
  );
};




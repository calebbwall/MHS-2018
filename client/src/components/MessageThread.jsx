import { useEffect, useRef } from 'react';
import { Avatar } from './Navbar';

/**
 * Scrollable message thread.
 * currentUserId: the logged-in user's ID (their messages appear on the right).
 */
export default function MessageThread({ messages, currentUserId }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-8">
        No messages yet. Say hi!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(msg => {
        const isOwn = msg.sender_id === currentUserId;
        const time  = new Date(msg.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit',
        });
        const date  = new Date(msg.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric',
        });

        return (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {!isOwn && (
              <Avatar
                user={{ full_name: msg.sender_name, profile_photo: msg.sender_photo }}
                size={8}
              />
            )}
            <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className={`px-4 py-2 rounded-2xl text-sm ${
                  isOwn
                    ? 'bg-maroon-800 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.body}
              </div>
              <span className="text-xs text-gray-400 mt-1 px-1">
                {date} at {time}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

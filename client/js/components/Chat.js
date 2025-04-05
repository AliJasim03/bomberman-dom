/**
 * Chat Component
 * Displays chat messages and allows sending new messages
 * Optimized to use CSS classes instead of inline styles
 */
import { createElement } from '../../../src/index.js';

/**
 * Format timestamp for chat messages
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted time string (HH:MM)
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Chat Component
 * @param {Object} props - Component props
 * @param {Array} props.messages - Array of chat messages
 * @param {Function} props.onSendMessage - Function to call when sending a message
 * @param {string} props.currentUserId - Current user's ID
 * @returns {Object} Virtual DOM element
 */
function Chat(props) {
    const { messages = [], onSendMessage, currentUserId } = props;

    /**
     * Handle sending a new message
     * @param {Event} e - Form submission event
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        // Get chat input
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();

        // Don't send empty messages
        if (!message) return;

        // Call onSendMessage callback
        onSendMessage(message);

        // Clear input
        chatInput.value = '';
    };

    return createElement('div', { class: 'chat' }, [
        // Chat header
        createElement('div', { class: 'chat-header' }, [
            createElement('h3', {}, ['Chat'])
        ]),

        // Chat messages
        createElement('div', {
                class: 'chat-messages',
                id: 'chat-messages'
            },
            messages.map(msg => createElement('div', {
                class: `chat-message ${msg.senderId === currentUserId ? 'own' : ''}`,
                key: `${msg.senderId}-${msg.timestamp}`
            }, [
                createElement('div', { class: 'message-header' }, [
                    createElement('span', { class: 'message-sender' }, [
                        msg.senderId === currentUserId ? 'You' : msg.sender
                    ]),
                    createElement('span', { class: 'message-time' }, [
                        formatTime(msg.timestamp)
                    ])
                ]),
                createElement('div', { class: 'message-content' }, [msg.message])
            ]))
        ),

        // Chat input form
        createElement('form', {
            class: 'chat-form',
            onSubmit: handleSubmit
        }, [
            createElement('input', {
                id: 'chat-input',
                type: 'text',
                class: 'chat-input',
                placeholder: 'Type your message...',
                maxlength: 100
            }),
            createElement('button', {
                type: 'submit',
                class: 'chat-send-button'
            }, ['Send'])
        ])
    ]);
}

// After the Chat component is rendered, automatically scroll to the bottom
const afterRender = () => {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
};

// Export with afterRender hook
Chat.afterRender = afterRender;

export default Chat;
 import { useState, useEffect} from 'react';  
import WebUtils from "../utils/WebUtils";
import Loading from '../utils/Loading';

 const Chat = (props) => {
        const [content, setContent] = useState('');
        const [file, setFile] = useState(null);
        const [messages,setMessages] = useState(undefined)

        useEffect(()=>{
          getMessages();
        },[props.selectedGroup])

        async function getMessages(){
          let x = await WebUtils.fetchMessages(props.selectedGroup);
          setMessages(x);
          console.log(x);
        }

        async function handleSend(){
          await WebUtils.send(props.selectedGroup, content, file)
          setContent('');
          setFile(null);
          getMessages();
        };

        const handlePin = async (messageId) => {
         WebUtils.pin(messageId);
        getMessages();
        };

        if(messages === undefined) return <Loading />
        else return (
          <div className="flex-1 p-4">
            <h2 className="text-xl mb-4">Group Chat</h2>
            <div className="h-96 overflow-y-auto mb-4 p-4 bg-gray-100 rounded">
              {messages.map((msg) => (
                <div key={msg.id} className={`mb-2 ${msg.is_pinned ? 'bg-yellow-100' : ''}`}>
                  <strong>{msg.username}: </strong>
                  {msg.content}
                  {msg.file_path && (
                    <div>
                      {msg.file_path.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img src={`http://localhost:5000/uploads/${msg.file_path}`} alt="attachment" className="max-w-xs" />
                      ) : (
                        <video src={`http://localhost:5000/uploads/${msg.file_path}`} controls className="max-w-xs" />
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handlePin(msg.id)}
                    className="text-blue-500 ml-2"
                  >
                    {msg.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder="Type a message..."
              />
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="p-2"
              />
              <button
                onClick={handleSend}
                className="p-2 bg-blue-500 text-white rounded"
              >
                Send
              </button>
            </div>
          </div>
        );
      };

      export default Chat;
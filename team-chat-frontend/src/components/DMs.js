 import { useState, useEffect } from 'react';  
   import WebUtils from "../utils/WebUtils";
   const DMs = (props) => {
        const [content, setContent] = useState('');
       const [dmMessages, setDmMessages] = useState([]);

useEffect(()=>{
  getMessages();
},[])
  



      const getMessages = async () => {
        let x = await WebUtils.fetchDmMessages(props.dmUsername);
        setDmMessages(x);
      }

        const handleSendDM = async (e) => {
          e.preventDefault();
         WebUtils.sendDM(props.dmUsername, content);
          setContent('');
         
          setTimeout(async ()=>{
             let x = await WebUtils.fetchDmMessages(props.dmUsername);
         setDmMessages(x);
          },850)
        
        };

        return (
          <div className="flex-1 p-4">
            <h2 className="text-xl mb-4">DM with User {props.dmUserId}</h2>
            <div className="h-96 overflow-y-auto mb-4 p-4 bg-gray-100 rounded">
              {dmMessages!==undefined && dmMessages.map((msg) => (
                <div key={msg.id} className="mb-2">
                  <strong>{msg.username}: </strong>{msg.content}
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 p-2 border rounded mr-2"
                placeholder="Type a message..."
              />
              <button
                onClick={handleSendDM}
                className="p-2 bg-blue-500 text-white rounded"
              >
                Send
              </button>
            </div>
          </div>
        );
      };

      export default DMs;
 import { useState } from 'react';  
import WebUtils from "../utils/WebUtils";
 const Calendar = (props) => {
        const [title, setTitle] = useState('');
        const [description, setDescription] = useState('');
        const [date, setDate] = useState('');

        const handleCreateEvent = async (e) => {
          e.preventDefault();
          WebUtils.createEvents(props.selectedGroup)
          setTitle('');
          setDescription('');
          setDate('');
          props.setEvents(WebUtils.fetchEvents(props.selectedGroup));
        };

        const handleRSVP = async (eventId, status) => {
         
          props.setEvents(WebUtils.fetchEvents(props.selectedGroup));
        };

        return (
          <div className="flex-1 p-4">
            <h2 className="text-xl mb-4">Calendar</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Event Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="p-2 border rounded mr-2"
              />
              <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="p-2 border rounded mr-2"
              />
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="p-2 border rounded mr-2"
              />
              <button
                onClick={handleCreateEvent}
                className="p-2 bg-blue-500 text-white rounded"
              >
                Create Event
              </button>
            </div>
            <div>
              {props.events.map((event) => (
                <div key={event.id} className="mb-4 p-4 bg-gray-100 rounded">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <p>{new Date(event.date).toLocaleString()}</p>
                  <div>
                    <button
                      onClick={() => handleRSVP(event.id, 'yes')}
                      className="p-2 bg-green-500 text-white rounded mr-2"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleRSVP(event.id, 'no')}
                      className="p-2 bg-red-500 text-white rounded mr-2"
                    >
                      No
                    </button>
                    <button
                      onClick={() => handleRSVP(event.id, 'maybe')}
                      className="p-2 bg-yellow-500 text-white rounded"
                    >
                      Maybe
                    </button>
                  </div>
                  <p>RSVPs: {event.rsvps.map(r => `${r.user_id}: ${r.status}`).join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        );
      };

      export default Calendar;
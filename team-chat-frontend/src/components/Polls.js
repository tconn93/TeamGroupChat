 import { useState } from 'react';  
import WebUtils from "../utils/WebUtils";

const Polls = (props) => {
        const [question, setQuestion] = useState('');
        const [options, setOptions] = useState(['', '']);

        const handleCreatePoll = async (e) => {
          e.preventDefault();
          WebUtils.createPoll(props.selectedGroup,question,options);
          setQuestion('');
          setOptions(['', '']);
         props.setPolls(WebUtils.fetchPolls(props.selectedGroup));
        };

        const handleVote = async (pollId, optionId) => {
          WebUtils.vote(pollId,optionId);
         props.setPolls(WebUtils.fetchPolls(props.selectedGroup));
        };

        return (
          <div className="flex-1 p-4">
            <h2 className="text-xl mb-4">Polls</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Poll Question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="p-2 border rounded mr-2"
              />
              {options.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[idx] = e.target.value;
                    setOptions(newOptions);
                  }}
                  className="p-2 border rounded mr-2 mb-2"
                />
              ))}
              <button
                onClick={() => setOptions([...options, ''])}
                className="p-2 bg-gray-500 text-white rounded mr-2"
              >
                Add Option
              </button>
              <button
                onClick={handleCreatePoll}
                className="p-2 bg-blue-500 text-white rounded"
              >
                Create Poll
              </button>
            </div>
            <div>
              {props.polls.map((poll) => (
                <div key={poll.id} className="mb-4 p-4 bg-gray-100 rounded">
                  <h3>{poll.question}</h3>
                  {poll.options.map((opt) => (
                    <div key={opt.id}>
                      <button
                        onClick={() => handleVote(poll.id, opt.id)}
                        className="p-2 bg-blue-500 text-white rounded mr-2"
                      >
                        {opt.text} ({opt.votes} votes)
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      };

      export default Polls;

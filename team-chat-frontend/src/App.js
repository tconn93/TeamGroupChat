import { useState, useEffect } from 'react';
import WebUtils from './utils/WebUtils';
import Calendar from './components/Calendar';
import Chat from './components/Chat';
import DMs from './components/DMs';
import Login from './components/Login';
import Polls from './components/Polls';
import './App.css';

const App = () => {
  const [user, setUser] = useState(undefined);
  const [groups, setGroups] = useState(undefined);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [dmUsername, setDmUsername] = useState(null);
 
  const [invitations, setInvitations] = useState([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (user !== undefined) {
      getGroups();
      getInvitations();
      console.log(user);
    }
  }, [user]);

  async function getGroups() {
    try {
      let g = await WebUtils.fetchGroups();
      console.log('Groups:', g);
      setGroups(g);
    } catch (err) {
      console.error('Fetch groups error:', err.response?.data);
    }
  }

  async function getInvitations() {
    try {
      let inv = await WebUtils.fetchInvitations();
      console.log('Invitations:', inv);
      setInvitations(inv);
    } catch (err) {
      console.error('Fetch invitations error:', err.response?.data);
    }
  }

  async function handleCreateGroup() {
    if (!searchQuery.trim()) {
      alert('Please enter a group name');
      return;
    }
    try {
      await WebUtils.createGroup(searchQuery);
      setSearchQuery('');
      getGroups();
    } catch (err) {
      console.error('Create group error:', err.response?.data);
      alert('Failed to create group: ' + err.response?.data?.error);
    }
  }

  async function handleInvite(groupId) {
    if (!inviteUsername) {
      alert('Please enter a username to invite');
      return;
    }
    try {
      await WebUtils.inviteToGroup(groupId, inviteUsername);
      alert('Invitation sent');
      setInviteUsername('');
    } catch (err) {
      console.error('Invite error:', err.response?.data);
      alert('Failed to send invitation: ' + err.response?.data?.error);
    }
  }

  async function handleAcceptInvitation(invitationId) {
    try {
      await WebUtils.acceptInvitation(invitationId);
      getGroups();
      getInvitations();
    } catch (err) {
      console.error('Accept invitation error:', err.response?.data);
      alert('Failed to accept invitation: ' + err.response?.data?.error);
    }
  }

  async function handleSearchUsers() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await WebUtils.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search users error:', err.response?.data);
      alert('Failed to search users: ' + err.response?.data?.error);
    }
  }

  async function handleOnClick(groupId) {
    setSelectedGroup(groupId);
    setDmUsername(null);
  }

  async function handleDMs() {
    let username = document.getElementById('dmName').value;
    setDmUsername(username);
    setSelectedGroup(null);

  }

  if (groups === undefined) {
    return <Login setUser={(x) => setUser(x)} />;
  } else {
    return (
      <div className="flex h-screen">
        <div className="w-1/4 p-4 bg-gray-200">
          <h2 className="text-xl mb-4">Groups</h2>
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              placeholder="New group name or search users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border rounded flex-1"
            />
            <button
              onClick={handleCreateGroup}
              className="p-2 bg-blue-500 text-white rounded"
            >
              Create Group
            </button>
            <button
              onClick={handleSearchUsers}
              className="p-2 bg-gray-500 text-white rounded"
            >
              Search Users
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg mb-2">Search Results</h3>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleDMs(user.username)}
                  className="p-2 cursor-pointer hover:bg-gray-300"
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}
          {groups.map((group) => (
            <div key={group.id}>
              <div
                onClick={() => handleOnClick(group.id)}
                className="p-2 cursor-pointer hover:bg-gray-300"
              >
                {group.name}
              </div>
              {group.is_admin && (
                <div className="flex space-x-2 mt-2">
                  <input
                    type="text"
                    placeholder="Username to invite"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    className="p-2 border rounded"
                  />
                  <button
                    onClick={() => handleInvite(group.id)}
                    className="p-2 bg-green-500 text-white rounded"
                  >
                    Invite
                  </button>
                </div>
              )}
            </div>
          ))}
          <h2 className="text-xl mb-4 mt-4">Invitations</h2>
          {invitations.map((inv) => (
            <div key={inv.id} className="p-2 bg-gray-100 rounded mb-2">
              <p>Invite to: {inv.group_name}</p>
              <button
                onClick={() => handleAcceptInvitation(inv.id)}
                className="p-2 bg-blue-500 text-white rounded"
              >
                Accept
              </button>
            </div>
          ))}
          <h2 className="text-xl mb-4 mt-4">DMs</h2>
          <input
            type="text"
            placeholder="Username for DM"
            name="dmName"
            id='dmName'
            className="p-2 border rounded w-full"
          /> <button
            onClick={() => handleDMs()}
            className="p-2 bg-blue-500 text-white rounded"
            > chat</button>
        </div>
        {selectedGroup ? (
          <div className="flex-1 flex flex-col">
            <Chat selectedGroup={selectedGroup} />
            <Calendar selectedGroup={selectedGroup} setEvents={(x) => setEvents(x)} events={events} />
            <Polls polls={polls} setPolls={(x) => setPolls(x)} selectedGroup={selectedGroup} />
          </div>
        ) : dmUsername ? (
          <DMs  dmUsername={dmUsername} />
        ) : (
          <div className="flex-1 p-4">Select a group or user to start chatting</div>
        )}
      </div>
    );
  }
};

export default App;
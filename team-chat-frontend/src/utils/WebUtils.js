import axios from "axios";

class WebUtils {
  static token = localStorage.getItem('token');

  static baseURL = 'https://chat.pcolarugby.com:8000';

  static async getToken(isRegister, username, password) {
    const url = isRegister ? this.baseURL+'/register' : this.baseURL+'/login';
    try {
      const res = await axios.post(url, { username, password });
      if (!isRegister) {
        this.token = res.data.token;
        localStorage.setItem('token', this.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        return { username };
      }
      return res.data;
    } catch (err) {
      console.error('Auth error:', err.response?.data);
      throw err;
    }
  }

  static async searchUsers(query) {
    try {
      const res = await axios.get(this.baseURL+`/users/search?query=${encodeURIComponent(query)}`, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Search users error:', err.response?.data);
      throw err;
    }
  }

  static async createGroup(name) {
    try {
      const res = await axios.post(this.baseURL+'/groups', { name }, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Create group error:', err.response?.data);
      throw err;
    }
  }

  static async fetchGroups() {
    try {
      const res = await axios.get(this.baseURL+'/groups', {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Fetch groups error:', err.response?.data);
      throw err;
    }
  }

  static async inviteToGroup(groupId, username) {
    try {
      const res = await axios.post(this.baseURL+`/groups/${groupId}/invite`, { username }, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Invite error:', err.response?.data);
      throw err;
    }
  }

  static async fetchInvitations() {
    try {
      const res = await axios.get(this.baseURL+'/invitations', {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Fetch invitations error:', err.response?.data);
      throw err;
    }
  }

  static async acceptInvitation(invitationId) {
    try {
      const res = await axios.post(this.baseURL+`/invitations/${invitationId}/accept`, {}, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Accept invitation error:', err.response?.data);
      throw err;
    }
  }

  static async fetchMessages(groupId) {
    try {
      const res = await axios.get(this.baseURL+`/groups/${groupId}/messages`, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Fetch messages error:', err.response?.data);
      throw err;
    }
  }

  static async fetchEvents(groupId) {
    try {
      const res = await axios.get(this.baseURL+`/groups/${groupId}/events`, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Fetch events error:', err.response?.data);
      throw err;
    }
  }

  static async fetchPolls(groupId) {
    try {
      const res = await axios.get(this.baseURL+`/groups/${groupId}/polls`, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Fetch polls error:', err.response?.data);
      throw err;
    }
  }

  static async fetchDmMessages(recipientUsername) {
    try {
      const res = await axios.get(this.baseURL+`/dms/${encodeURIComponent(recipientUsername)}`, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
console.log(err)
    }
  }

  static async createEvents(groupId, title, description, date) {
    try {
      const res = await axios.post(this.baseURL+`/groups/${groupId}/events`, {
        title,
        description,
        date
      }, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Create event error:', err.response?.data);
      throw err;
    }
  }

  static async rsvp(eventId, status) {
    try {
      const res = await axios.post(this.baseURL+`/events/${eventId}/rsvp`, { status }, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('RSVP error:', err.response?.data);
      throw err;
    }
  }

  static async send(groupId, content, file) {
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (file) formData.append('file', file);
      const res = await axios.post(this.baseURL+`/groups/${groupId}/messages`, formData, {
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      return res.data;
    } catch (err) {
      console.error('Send message error:', err.response?.data);
      throw err;
    }
  }

  static async pin(messageId) {
    try {
      const res = await axios.post(this.baseURL+`/messages/${messageId}/pin`, {}, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Pin message error:', err.response?.data);
      throw err;
    }
  }

  static async createPoll(groupId, question, options) {
    try {
      const res = await axios.post(this.baseURL+`/groups/${groupId}/polls`, {
        question,
        options
      }, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Create poll error:', err.response?.data);
      throw err;
    }
  }

  static async vote(pollId, optionId) {
    try {
      const res = await axios.post(this.baseURL+`/polls/${pollId}/vote`, { option_id: optionId }, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
      console.error('Vote error:', err.response?.data);
      throw err;
    }
  }

  static async sendDM(recipientUsername, content) {
    try {
      const res = await axios.post(this.baseURL+`/dms/${encodeURIComponent(recipientUsername)}`, { content }, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });
      return res.data;
    } catch (err) {
 
    }
  }
}

export default WebUtils;
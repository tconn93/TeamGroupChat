# TeamGroupChat
Website to be able to handle a group chat for your team

Author - Tyler Conner

My website - [Tyler.AG](https://tyler.ag)  
Project List - [Projects](https://tyler.ag/projects)  
Live Demo - [Team Chat App](https://chat.pcolarugby.com)  



## Getting Started

Clone this repo:

```linux
git clone https://github.com/tconn93/TeamGroupChat.git
```

### Backend

Let's start by setting up the backend. Setup a venv and install the requirements:

```pip
source .venv/bin/activate
pip install -r requirements.txt
```

Now let's start the app
```linux
python app.py
```

You should see the server running on `http://127.0.0.1:5000` . 

### Frontend

Now let's deploy the frontend of the website.

```linux
cd team-chat-frontend
npm install
npm start
```

Now you should be able to access the react server at `http://localhost:3000`.  


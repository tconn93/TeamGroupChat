from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

app = Flask(__name__)

# --- Configuration ---
# Load configuration from environment variables for better security and flexibility.
# Use a local SQLite database as a fallback for simple development.
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Bandit@192.168.0.132:5432/RUGBYCHAT'
# It's crucial that the JWT_SECRET_KEY is set in your environment for production.
app.config['JWT_SECRET_KEY'] = 'your-secret-key'

UPLOAD_FOLDER = 'Uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app, resources={r"/*": {"origins": "*"}})

# Ensure upload directory exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# JWT Error Handlers with Logging
@jwt.unauthorized_loader
def unauthorized_response(callback):
    return jsonify({'error': 'Missing or invalid token'}), 401

@jwt.invalid_token_loader
def invalid_token_response(callback):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    app.logger.error(f"Invalid token received: {token}")
    return jsonify({'error': 'Invalid token', 'message': callback}), 422

@jwt.expired_token_loader
def expired_token_response(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired', 'payload': jwt_payload}), 401

# Log token claims for debugging
@jwt.token_verification_loader
def token_verification_callback(jwt_header, jwt_payload):
    app.logger.info(f"Token payload: {jwt_payload}")
    return True

# Database Models
class Member(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(1200), nullable=False)

class GroupChat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    members = db.relationship('GroupMember', backref='group_chat', lazy=True)
    invitations = db.relationship('Invitation', backref='group_chat', lazy=True)

class GroupMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group_chat.id'), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

class Invitation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group_chat.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group_chat.id'), nullable=True)
    is_dm = db.Column(db.Boolean, default=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=True)
    file_path = db.Column(db.String(200), nullable=True)
    is_pinned = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class ChatEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    date = db.Column(db.DateTime, nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group_chat.id'), nullable=False)

class RSVP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('chat_event.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)

class Poll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(200), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group_chat.id'), nullable=False)
    options = db.relationship('PollOption', backref='poll', lazy=True)

class PollOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    option_text = db.Column(db.String(100), nullable=False)
    votes = db.relationship('PollVote', backref='option', lazy=True)

class PollVote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('member.id'), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey('poll_option.id'), nullable=False)

with app.app_context():
    db.create_all()

# User Routes
@app.route('/users/search', methods=['GET'])
@jwt_required()
def search_users():
    query = request.args.get('query', '')
    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400
    users = Member.query.filter(Member.username.ilike(f'%{query}%')).all()
    return jsonify([{'id': u.id, 'username': u.username} for u in users])

# Auth Routes
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if Member.query.filter_by(username=username).first():
        return jsonify({'error': 'Username exists'}), 400
    hashed_password = generate_password_hash(password)
    user = Member(username=username, password_hash=hashed_password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = Member.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        token = create_access_token(identity=str(user.id))
        app.logger.info(f"Generated token for user {user.id}: {token}")
        return jsonify({'token': token}), 200
    return jsonify({'error': 'Invalid credentials'}), 401

# Group Routes
@app.route('/groups', methods=['GET'])
@jwt_required()
def get_groups():
    user_id = get_jwt_identity()
    groups = GroupChat.query.join(GroupMember).filter(GroupMember.user_id == user_id).all()
    return jsonify([{'id': g.id, 'name': g.name, 'is_admin': GroupMember.query.filter_by(user_id=user_id, group_id=g.id).first().is_admin} for g in groups])

@app.route('/groups', methods=['POST'])
@jwt_required()
def create_group():
    user_id = get_jwt_identity()
    data = request.get_json()
    group = GroupChat(name=data['name'])
    db.session.add(group)
    db.session.flush()
    member = GroupMember(user_id=user_id, group_id=group.id, is_admin=True)
    db.session.add(member)
    db.session.commit()
    return jsonify({'id': group.id, 'name': group.name, 'is_admin': True}), 201

@app.route('/groups/<int:group_id>/is-admin', methods=['GET'])
@jwt_required()
def is_group_admin(group_id):
    user_id = get_jwt_identity()
    membership = GroupMember.query.filter_by(user_id=user_id, group_id=group_id, is_admin=True).first()
    return jsonify({'is_admin': bool(membership)})

# Invitation Routes
@app.route('/groups/<int:group_id>/invite', methods=['POST'])
@jwt_required()
def invite_to_group(group_id):
    user_id = get_jwt_identity()
    membership = GroupMember.query.filter_by(user_id=user_id, group_id=group_id, is_admin=True).first()
    if not membership:
        return jsonify({'error': 'Only group admins can invite users'}), 403
    data = request.get_json()
    username = data.get('username')
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    invitee = Member.query.filter_by(username=username).first()
    if not invitee:
        return jsonify({'error': 'User not found'}), 404
    if GroupMember.query.filter_by(user_id=invitee.id, group_id=group_id).first():
        return jsonify({'error': 'User is already a member'}), 400
    invitation = Invitation(user_id=invitee.id, group_id=group_id, status='pending')
    db.session.add(invitation)
    db.session.commit()
    return jsonify({'message': 'Invitation sent', 'invitation_id': invitation.id}), 201

@app.route('/invitations', methods=['GET'])
@jwt_required()
def get_invitations():
    user_id = get_jwt_identity()
    invitations = Invitation.query.filter_by(user_id=user_id, status='pending').all()
    return jsonify([{
        'id': i.id,
        'group_id': i.group_id,
        'group_name': GroupChat.query.get(i.group_id).name,
        'timestamp': i.timestamp.isoformat()
    } for i in invitations])

@app.route('/invitations/<int:invitation_id>/accept', methods=['POST'])
@jwt_required()
def accept_invitation(invitation_id):
    user_id = get_jwt_identity()
    invitation = Invitation.query.filter_by(id=invitation_id, user_id=user_id, status='pending').first()
    if not invitation:
        return jsonify({'error': 'Invalid or non-pending invitation'}), 400
    invitation.status = 'accepted'
    member = GroupMember(user_id=user_id, group_id=invitation.group_id)
    db.session.add(member)
    db.session.commit()
    return jsonify({'message': 'Invitation accepted'})

# Message Routes
@app.route('/groups/<int:group_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(group_id):
    user_id = get_jwt_identity()
    if not GroupMember.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'error': 'Not a group member'}), 403
    messages = Message.query.filter_by(group_id=group_id, is_dm=False).all()
    return jsonify([{
        'id': m.id,
        'content': m.content,
        'user_id': m.user_id,
        'username': Member.query.get_or_404(m.user_id).username,
        'file_path': m.file_path,
        'is_pinned': m.is_pinned,
        'timestamp': m.timestamp.isoformat()
    } for m in messages])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/groups/<int:group_id>/messages', methods=['POST'])
@jwt_required()
def send_message(group_id):
    user_id = get_jwt_identity()
    if not GroupMember.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'error': 'Not a group member'}), 403
    try:
        if 'file' in request.files:
            file = request.files['file']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                content = request.form.get('content', '')
                message = Message(content=content, user_id=user_id, group_id=group_id, file_path=filename)
                db.session.add(message)
                db.session.commit()
                return jsonify({'status': 'success', 'message': 'File and message received', 'content': content, 'filename': filename}), 200
        else:
            content = request.form.get('content', '')
            if not content:
                return jsonify({'error': 'Content is required'}), 400
            message = Message(content=content, user_id=user_id, group_id=group_id)
            db.session.add(message)
            db.session.commit()
            return jsonify({'status': 'success', 'message': 'Text message received', 'content': content}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/messages/<int:message_id>/pin', methods=['POST'])
@jwt_required()
def pin_message(message_id):
    user_id = get_jwt_identity()
    message = Message.query.get_or_404(message_id)
    if not GroupMember.query.filter_by(user_id=user_id, group_id=message.group_id).first():
        return jsonify({'error': 'Not a group member'}), 403
    message.is_pinned = not message.is_pinned
    db.session.commit()
    return jsonify({'message': 'Message pinned/unpinned'})

# DM Routes
@app.route('/dms/<string:recipient_username>', methods=['POST'])
@jwt_required()
def send_dm(recipient_username):
    user_id = get_jwt_identity()
    recipient = Member.query.filter_by(username=recipient_username).first()
    data = request.get_json()
    if not recipient:
        return jsonify({'error': 'Recipient not found'}), 404
    content = data.get('content')
    message = Message(content=content, user_id=user_id, recipient_id=recipient.id, is_dm=True)
    db.session.add(message)
    db.session.commit()
    return jsonify({'message': 'DM sent'}), 201

@app.route('/dms/<string:recipient_username>', methods=['GET'])
@jwt_required()
def get_dms(recipient_username):
    user_id = get_jwt_identity()
    recipient = Member.query.filter_by(username=recipient_username).first()
    if not recipient:
        return jsonify({'error': 'Recipient not found'}), 404
    messages = Message.query.filter(
        ((Message.user_id == user_id) & (Message.recipient_id == recipient.id)) |
        ((Message.user_id == recipient.id) & (Message.recipient_id == user_id)),
        Message.is_dm == True
    ).all()
    return jsonify([{
        'id': m.id,
        'content': m.content,
        'user_id': m.user_id,
        'username': Member.query.get(m.user_id).username,
        'timestamp': m.timestamp.isoformat()
    } for m in messages])

# Event Routes
@app.route('/groups/<int:group_id>/events', methods=['POST'])
@jwt_required()
def create_event(group_id):
    user_id = get_jwt_identity()
    if not GroupMember.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'error': 'Not a group member'}), 403
    data = request.get_json()
    event = Event(
        title=data['title'],
        description=data.get('description', ''),
        date=datetime.fromisoformat(data['date']),
        group_id=group_id
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({'id': event.id, 'title': event.title}), 201

@app.route('/groups/<int:group_id>/events', methods=['GET'])
@jwt_required()
def get_events(group_id):
    user_id = get_jwt_identity()
    if not GroupMember.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'error': 'Not a group member'}), 403
    events = Event.query.filter_by(group_id=group_id).all()
    return jsonify([{
        'id': e.id,
        'title': e.title,
        'description': e.description,
        'date': e.date.isoformat(),
        'rsvps': [{'user_id': r.user_id, 'status': r.status} for r in e.rsvps]
    } for e in events])

@app.route('/events/<int:event_id>/rsvp', methods=['POST'])
@jwt_required()
def rsvp_event(event_id):
    user_id = get_jwt_identity()
    event = Event.query.get_or_404(event_id)
    if not GroupMember.query.filter_by(user_id=user_id, group_id=event.group_id).first():
        return jsonify({'error': 'Not a group member'}), 403
    data = request.get_json()
    rsvp = RSVP.query.filter_by(user_id=user_id, event_id=event_id).first()
    if rsvp:
        rsvp.status = data['status']
    else:
        rsvp = RSVP(user_id=user_id, event_id=event_id, status=data['status'])
        db.session.add(rsvp)
    db.session.commit()
    return jsonify({'message': 'RSVP updated'})

# Poll Routes
@app.route('/groups/<int:group_id>/polls', methods=['POST'])
@jwt_required()
def create_poll(group_id):
    user_id = get_jwt_identity()
    if not GroupMember.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'error': 'Not a group member'}), 403
    data = request.get_json()
    poll = Poll(question=data['question'], group_id=group_id)
    db.session.add(poll)
    db.session.flush()
    for option in data['options']:
        poll_option = PollOption(poll_id=poll.id, option_text=option)
        db.session.add(poll_option)
    db.session.commit()
    return jsonify({'id': poll.id, 'question': poll.question}), 201

@app.route('/groups/<int:group_id>/polls', methods=['GET'])
@jwt_required()
def get_polls(group_id):
    user_id = get_jwt_identity()
    if not GroupMember.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'error': 'Not a group member'}), 403
    polls = Poll.query.filter_by(group_id=group_id).all()
    return jsonify([{
        'id': p.id,
        'question': p.question,
        'options': [{
            'id': o.id,
            'text': o.option_text,
            'votes': len(o.votes)
        } for o in p.options]
    } for p in polls])

@app.route('/polls/<int:poll_id>/vote', methods=['POST'])
@jwt_required()
def vote_poll(poll_id):
    user_id = get_jwt_identity()
    poll = Poll.query.get_or_404(poll_id)
    if not GroupMember.query.filter_by(user_id=user_id, group_id=poll.group_id).first():
        return jsonify({'error': 'Not a group member'}), 403
    data = request.get_json()
    option_id = data['option_id']
    existing_vote = PollVote.query.filter_by(user_id=user_id, option_id=option_id).first()
    if existing_vote:
        return jsonify({'error': 'Already voted'}), 400
    vote = PollVote(user_id=user_id, option_id=option_id)
    db.session.add(vote)
    db.session.commit()
    return jsonify({'message': 'Vote recorded'})

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/')
def hello():
    return "Hello from Flask API!"

if __name__ == '__main__':
    app.run(debug=True)
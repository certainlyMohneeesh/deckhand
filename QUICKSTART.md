# 🚀 Quick Start - Multi-Device Presentation System

## Start the Application

### Option 1: Using the Startup Script (Easiest)

```bash
cd deckhand
chmod +x start.sh
./start.sh
```

This starts both servers automatically:
- **Socket.io server** on port 3001
- **Next.js dev server** on port 3000

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Socket.io Server:**
```bash
cd deckhand
bun run socket
```

**Terminal 2 - Next.js Server:**
```bash
cd deckhand
bun run dev
```

### Option 3: Using Concurrently (Single Terminal)

```bash
cd deckhand
bun run dev:all
```

## 📱 How to Use

### 1. Start a Presentation (Desktop/Laptop)

1. **Start the servers** using one of the methods above
2. Open **http://localhost:3000** in your browser
3. **Upload your presentation** (PDF or PPTX) OR **Upload a script** for teleprompter
4. Click **"Start Presentation"**
5. A **room code** appears (e.g., ABC-123)
6. **QR code** shows in the top-right corner

### 2. Join from Mobile Phone

#### As Remote Control:
1. Open **http://localhost:3000/join** (or scan QR code)
2. Enter the **6-character room code** (e.g., ABC123)
3. Select role: **"Remote Control"**
4. Click **"Join Room"**
5. Use **Next/Previous** buttons to control slides

#### As Teleprompter:
1. **FIRST**: Upload your script (TXT or PDF) on the homepage
2. Click **"Join Presentation"**
3. Enter the **room code**
4. Select role: **"Teleprompter"**
5. Click **"Join Room"**
6. Your script will auto-load!

## 🔍 Troubleshooting

### "Not connected to server" error

**Problem**: Socket.io server not running

**Solution**:
```bash
# Check if Socket.io is running on port 3001
curl http://localhost:3001

# If not, start it:
cd deckhand
bun run socket
```

### Join page doesn't work

**Checklist**:
- ✅ Both servers are running (check terminal output)
- ✅ Socket.io server shows: `[Socket.io] Server running on port 3001`
- ✅ Next.js shows: `Local: http://localhost:3000`
- ✅ Room code is exactly 6 characters (letters and numbers)
- ✅ You selected a device role (Remote/Teleprompter/Stage)

### Can't connect from phone

**On same WiFi network**:
1. Find your computer's local IP:
   ```bash
   # Linux/Mac
   ip addr show | grep inet
   # or
   ifconfig | grep inet
   ```

2. Access from phone using IP:
   - Stage: `http://192.168.x.x:3000`
   - Join: `http://192.168.x.x:3000/join`

**Using different network** (advanced):
- Use ngrok or similar tunneling service
- Or set up port forwarding

### Script doesn't load on teleprompter

**Solution**:
1. Upload script on **homepage first** (before joining)
2. Then go to join page
3. Select "Teleprompter" role
4. Script will auto-load from session storage

If script still doesn't load:
- Upload the script again on the teleprompter page itself
- Use the "Upload Script" button in the top-right

## 📋 Testing Checklist

- [ ] Start both servers
- [ ] Open http://localhost:3000
- [ ] Upload presentation → Click "Start Presentation"
- [ ] Room code appears with QR code
- [ ] Open http://localhost:3000/join on phone
- [ ] Enter room code correctly (6 characters)
- [ ] Select "Remote Control" role
- [ ] Click "Join Room"
- [ ] Verify navigation works (Next/Prev buttons)
- [ ] Go back to homepage
- [ ] Upload script (TXT or PDF) for teleprompter
- [ ] Join room as "Teleprompter"
- [ ] Verify script loads automatically

## 🎯 Features Working

### ✅ Homepage
- Upload presentations (PDF/PPTX)
- Upload scripts (TXT/PDF) for teleprompter
- Join presentation button
- Feature cards

### ✅ Stage (Presenter)
- QR code display
- Room code with copy button
- Connected devices list
- Slide navigation
- Broadcasts to all devices

### ✅ Remote Control
- Large Next/Prev buttons
- Current slide display
- Progress bar
- Keyboard shortcuts
- Swipe gestures
- Real-time sync

### ✅ Teleprompter
- Script upload (TXT/PDF)
- Auto-load pre-uploaded scripts
- Font size controls
- Auto-scroll
- Mirror mode
- Slide progress indicator

## 🔧 Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | Kill process: `lsof -ti:3000 \| xargs kill -9` |
| Port 3001 already in use | Kill process: `lsof -ti:3001 \| xargs kill -9` |
| Bun not found | Install bun: `curl -fsSL https://bun.sh/install \| bash` |
| Module not found | Run: `bun install` |
| TypeScript errors | Check node_modules installed correctly |

## 📞 Need Help?

1. Check both terminal outputs for errors
2. Verify room code is exactly 6 characters
3. Make sure Socket.io server is running
4. Ensure you selected a device role before joining
5. Try refreshing the page

---

**Ready to present!** 🎉

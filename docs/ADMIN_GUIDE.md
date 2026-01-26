# Admin Guide - Guestbook for Giuliana's 40th Birthday

## Introduction

Welcome to the digital guestbook platform for Giuliana's 40th birthday! This is a private web application where friends can leave messages, photos, and videos to celebrate this special moment.

**Who can access:**
- **Friends (Guest)**: Can register, upload content after approval
- **Administrator (Pierluigi)**: Approves users and moderates content
- **VIP (Giuliana)**: Views only approved content in the final gallery

As administrator, you have complete control over who can access and which content is shown to Giuliana.

---

## Admin Access

### How to log in

1. **Login URL**: Go to `https://[app-domain]/login`
2. **Credentials**: Use the admin email configured in Supabase
3. **Role**: Your account has `admin` role in the database

After login, you will be redirected to the admin dashboard where you can:
- Approve new users
- Moderate uploaded content
- Monitor platform statistics

---

## User Approval

### Access the section

From the admin dashboard, go to `/approve-users` or click the "Approva Utenti" menu.

### How the approval process works

1. **View pending users list**: You will see all friends who have registered and are awaiting approval
2. **Available information**:
   - Full name
   - Email
   - Registration date
   - Current status (`pending`)

3. **Available actions**:
   - **Approve**: Click the green "Approva" button to authorize the user
   - **Reject**: Click the red "Rifiuta" button to deny access (use with caution)

### What happens after approval

When you approve a user:
1. Their account status changes from `pending` to `approved`
2. The user receives a notification (if configured) that they can now access
3. They can log in and upload content (messages, photos, videos)
4. Their content must still be approved by you before being visible to Giuliana

### Best Practices

- **Timeliness**: Try to approve users within 24 hours of registration
- **Verification**: Check that the email and name match people you know
- **Communication**: If you reject a user, contact them privately to explain the reason

---

## Content Moderation

### Access the section

From the admin dashboard, go to `/approve-content` or click the "Modera Contenuti" menu.

### How to view content

The page shows all uploaded content awaiting approval:

1. **Complete preview**:
   - **Text messages**: Displayed in full
   - **Photos**: Image preview with ability to enlarge
   - **Videos**: Video player with controls (play/pause/volume)

2. **Additional information**:
   - Who uploaded the content (username)
   - Date and time of upload
   - Content type (text/photo/video)

### How to approve or reject

For each content you have two options:

1. **Approve** (green button):
   - The content becomes visible in Giuliana's VIP gallery
   - Cannot be edited anymore

2. **Reject** (red button):
   - The content is NOT shown to Giuliana
   - Use this option for:
     - Inappropriate or offensive content
     - Low quality or irrelevant photos/videos
     - Duplicates of the same message
     - Non-functioning technical content

### Moderation Best Practices

**Approval criteria:**
- ✅ Affectionate, funny, sincere messages
- ✅ Photos of memories, shared moments, parties
- ✅ Videos of wishes, personal messages
- ✅ Good quality content (readable, visible)

**Rejection criteria:**
- ❌ Offensive, vulgar, or inappropriate content
- ❌ Completely blurry or damaged photos/videos
- ❌ Spam or irrelevant content
- ❌ Test messages ("prova", "test123", etc.)

**Timing:**
- Moderate content within 12 hours of upload
- If possible, do a review morning and evening
- Quickly approve obviously appropriate content

---

## Inviting Friends

### Registration link

The link to share with friends is:
```
https://[app-domain]/register
```

You can personalize the invitation message, for example:

**WhatsApp/SMS Template:**
```
Ciao! 🎉

Ti invito a lasciare un messaggio/foto/video speciale
per il 40° compleanno di Giuliana!

Registrati qui: https://[app-domain]/register

Dopo la registrazione dovrai attendere la mia approvazione
(max 24h), poi potrai caricare i tuoi contenuti.

Grazie! 🎈
```

**Email Template:**
```
Subject: Guestbook digitale per il 40° compleanno di Giuliana 🎂

Ciao [Nome],

Sto organizzando una sorpresa per il 40° compleanno di Giuliana!
Ho creato un guestbook digitale dove puoi lasciare:
- Un messaggio di auguri
- Foto di ricordi insieme
- Un video messaggio

Come partecipare:
1. Registrati su: https://[app-domain]/register
2. Attendi la mia approvazione (entro 24h)
3. Carica i tuoi contenuti

Tutti i contenuti verranno mostrati a Giuliana il giorno del compleanno!

Grazie per la partecipazione!
Pierluigi
```

### How to share effectively

1. **Phase 1 (2 weeks before)**: Send invites to the first 10-15 closest friends
2. **Phase 2 (1 week before)**: Send invites to the rest of the friends
3. **Phase 3 (3-4 days before)**: Reminder to friends who haven't registered yet
4. **Closure (2 days before)**: Stop approving new users (feature freeze)

---

## Monitoring

### Statistics Dashboard

In the admin dashboard you can monitor:

1. **Users**:
   - Total registered
   - Approved users
   - Users awaiting approval
   - Rejected users

2. **Content**:
   - Total uploaded content
   - Approved content (visible to Giuliana)
   - Content awaiting moderation
   - Rejected content

3. **Content Type**:
   - Text messages
   - Uploaded photos
   - Uploaded videos

### Supabase Storage Monitoring

**Free tier limit**: 500MB total

**How to check space used:**
1. Access Supabase dashboard: `https://app.supabase.com`
2. Go to `Storage` in the left menu
3. Select the `content-uploads` bucket
4. Check space used in the top right

**Approximate calculation:**
- Average compressed photo: 2-3 MB
- 30 second video: 5-8 MB
- 500MB = approximately 60-80 photos OR 60-100 videos

**Actions if approaching limit:**
- Reject duplicate or low-quality content
- Ask friends to upload short videos (max 30-60 seconds)
- Consider upgrading to Supabase Pro plan ($25/month) if necessary

---

## FAQ and Troubleshooting

### A friend can't register

**Problem**: Registration error

**Solutions:**
1. Check that they entered a valid email
2. Verify they are not already registered with that email
3. Ask them to try with a different browser (Chrome/Safari)
4. If problem persists, register them manually from Supabase:
   - Go to `https://app.supabase.com`
   - Select the project
   - Go to `Authentication` → `Users`
   - Click `Invite user` and enter their email
   - Set the role to `guest` in the `profiles` table

### A friend can't upload photos/videos

**Problem**: Upload failed or blocked

**Solutions:**
1. **File size**: Max 10MB for photos, 20MB for videos
   - If file is too large, ask to compress it
   - Photos: use apps like "Compress Photos" (iOS) or "Photo Compress" (Android)
   - Videos: record at lower resolution (720p instead of 4K)

2. **Unsupported format**:
   - Supported photos: JPG, PNG, WEBP
   - Supported videos: MP4, MOV, WEBM
   - If different format, ask to convert

3. **Slow connection**:
   - Ask to try with WiFi instead of mobile data
   - Video upload can take 1-3 minutes

4. **Unsupported browser**:
   - Use updated Chrome/Safari/Firefox
   - Avoid outdated browsers or incognito mode with restrictions

### I don't see approved content in the VIP gallery

**Problem**: Approved content not appearing

**Solutions:**
1. Verify that the status is actually `approved` in the database
2. Log out and log in with the VIP account
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Check for errors in browser console (F12)

### Giuliana accidentally saw the gallery before her birthday

**Problem**: Surprise partially spoiled

**Solutions:**
1. **Prevention**: Use a separate email account for VIP that Giuliana doesn't know
2. **If it happens**: Continue anyway, there will be new content she hasn't seen
3. **Plan B**: Consider showing content progressively/gradually during the party

### How to contact technical support

If you have technical issues you can't solve:

1. **Check the logs**:
   - Go to Vercel dashboard for frontend logs
   - Go to Supabase dashboard for database logs

2. **Documentation**:
   - Next.js: `https://nextjs.org/docs`
   - Supabase: `https://supabase.com/docs`

3. **Contact the developer**:
   - [Insert developer contact if applicable]
   - Provide screenshot of the error
   - Indicate browser and device used

---

## Best Practices Pre-Event

### Recommended Timeline

**2 weeks before:**
- ✅ Send invites to first friends
- ✅ Test the registration and upload process yourself
- ✅ Verify that email notifications work

**1 week before:**
- ✅ Send invites to all remaining friends
- ✅ Approve users within 24h of registration
- ✅ Start moderating the first content

**3 days before:**
- ✅ **FINAL DEPLOY**: Ensure everything works in production
- ✅ Test VIP gallery with test account
- ✅ Verify performance on mobile (iOS Safari, Android Chrome)
- ✅ Check Supabase storage (ideally under 400MB)

**2 days before:**
- ✅ **FEATURE FREEZE**: Do not approve new users
- ✅ **STOP CHANGES**: Do not change code/configuration
- ✅ Moderate all pending content
- ✅ Test on different devices (smartphone, tablet, laptop)

**1 day before:**
- ✅ Final review of approved content
- ✅ Prepare VIP account for Giuliana
- ✅ Verify that everything is perfect

**Birthday:**
- 🎉 Show the gallery to Giuliana!
- 📸 Capture her reaction
- 💬 Let her explore the content
- ⭐ Friends can continue adding reactions in real-time

### Pre-Event Checklist

```
□ 30+ friends registered and approved
□ 50+ content items uploaded and approved
□ Storage under 450MB (safety margin)
□ VIP gallery tested and working
□ Performance Lighthouse >80 (mobile and desktop)
□ Tested on Chrome, Safari, Firefox
□ Tested on iOS and Android
□ VIP account ready with credentials
□ Database backup made (export from Supabase)
□ Plan B prepared (what to do if everything breaks)
```

### Final Suggestions

1. **Backup**: Export the database from Supabase 1-2 days before the event
2. **Plan B**: Print some special messages as fallback if there are technical issues
3. **Presence**: Be present during the "reveal" to help Giuliana navigate
4. **Celebration**: Use a projector or large TV to show the gallery during the party
5. **Memory**: Export all content after the event as permanent backup

---

## Conclusion

Thank you for organizing this special experience for Giuliana!

This platform was designed to be simple to manage, but if you have questions or doubts feel free to consult this guide or ask for support.

**Remember the 3 pillars of administration:**
1. ⏱️ **Timeliness**: Approve users and content quickly
2. 🛡️ **Quality**: Moderate carefully to ensure appropriate content
3. 🎯 **Preparation**: Test everything 3 days before, feature freeze 2 days before

Good luck and happy birthday to Giuliana! 🎂🎉

---

*Last review: 2026-01-23*
*Version: 1.0*

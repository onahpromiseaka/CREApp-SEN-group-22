rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 0. Global Safety Net
    match /{document=**} {
      allow read, write: if false;
    }

    // 3. Helper Functions
    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isValidId(id) { return id is string && id.size() <= 128; }
    function incoming() { return request.resource.data; }
    function existing() { return resource.data; }

    // Validation Blueprints
    function isValidUser(data) {
      return data.fullName is string && 
             data.email is string;
    }

    // 4. Identity & Resource Access
    match /users/{userId} {
      allow get, list: if isSignedIn();
      allow create: if isOwner(userId) && isValidUser(incoming());
      allow update: if isOwner(userId);
    }

    match /users/{userId}/contacts/{contactId} {
      allow read, write: if isOwner(userId);
    }

    match /users/{userId}/notes/{noteId} {
      allow read, write: if isOwner(userId);
    }

    match /users/{userId}/lessons/{lessonId} {
      allow read, write: if isOwner(userId);
    }

    match /chats/{chatId} {
      function canAccessChat() {
        return isSignedIn() && (
          (resource != null && request.auth.uid in resource.data.participants) ||
          (request.resource != null && request.auth.uid in request.resource.data.participants)
        );
      }

      allow read, update: if canAccessChat();
      allow create: if isSignedIn() && request.auth.uid in incoming().participants;
      
      match /messages/{messageId} {
        // Access is strictly tied to parent chat participation
        allow read: if isSignedIn() && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if isSignedIn() && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow update: if isSignedIn() && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }

    match /callLogs/{callId} {
      allow read: if isSignedIn() && request.auth.uid in existing().participants;
      allow create: if isSignedIn() && request.auth.uid in incoming().participants;
    }

    // OTP Collection (Managed by server)
    match /otps/{email} {
      // Allow unauthenticated writes for the OTP flow as the server is current using Client SDK
      allow read, write: if true;
    }
  }
}

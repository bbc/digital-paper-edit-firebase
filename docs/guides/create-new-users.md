# Adding new users to DPE
05/05/2020

1. In the Firebase console, click on `Authentication` on the left-hand navigation menu. 
2. Click on `Add User` in the upper-right and enter their email address and a password. 
3. Copy the `User UID` value from the table. 
4. Navigate to `Database` on the left-hand navigation menu.
5. In the database view, select: `digital-paper-edit` > `users` > `Add document`.
[Add document button selected in database view](../img/add-user-document.png)
6. Enter the user's UID value in the `Document Id` field in the modal. 
7. Add the following to the document:
    a. `projects`: []
    b. `role`: 'ADMIN'
[Add fields and ID to new user document](../img/add-user-modal.png)
8. In the database view, create two new collections called `audio` and `uploads`. Leave these empty. 
[User fields](../img/add-user-fields.png)
9. Done! The new user can now sign in with their new username and password
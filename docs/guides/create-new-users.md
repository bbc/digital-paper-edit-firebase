# Adding new users to DPE
05/05/2020

1. In the Firebase console, click on `Authentication` on the left-hand navigation menu.

    ![](../img/sidebar.png)

1. Click on `Add User` in the upper-right.

1. Enter their email address and a password and click the `Add User` buttton below. 

    ![Add fields and ID to new user document](../img/user-email-pass.png)

1. Copy the `User UID` value from the table. 

    ![Add fields and ID to new user document](../img/user-table.png)

1. Navigate to `Database` on the left-hand navigation menu.

1. In the database view, select: `digital-paper-edit` > `users` > `Add document`.

    ![Add document button selected in database view](../img/add-user-document.png)

1. Enter the user's UID value in the `Document Id` field in the modal. 

1. Add the following to the document:

    - `projects`: []
    - `role`: 'ADMIN'

    ![Add fields and ID to new user document](../img/add-user-modal.png)

1. In the database view, create two new collections called `audio` and `uploads`. Leave these empty. 

    ![User fields](../img/add-user-fields.png)

1. Done! The new user can now sign in with their new username and password.
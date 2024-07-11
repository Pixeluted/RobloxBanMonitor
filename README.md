## Roblox Ban Monitor

Open-sourced ban monitor as discord bot. What are it's features?

1. Allows you to add multiple accounts to monitor
2. Notifies you whenever account got banned/unbanned or that it can be re-activated
3. Notifies you whenever account authorization got invalid so you can update it

### Screenshots

### How to set it up?

Firstly you need NodeJS (version 20 or higher)
Then git clone this repository by doing:

```
git clone https://github.com/Pixeluted/RobloxBanMonitor
```

Open terminal inside the cloned folder and run this command

```
npm install
```

This will install all packages needed to run this.

Next, you will need MongoDB, you can either self host or use MongoDB's cloud solution that has free trial and should be absolutely ok with this project. You can find it [here](https://www.mongodb.com/atlas)

Next, you will need create .env file, and paste this template there:

```
BOT_TOKEN=
BOT_OWNER_USER_ID=
DATABASE_URL="URL"
```

BOT_TOKEN is the token of the bot u want to host it
BOT_OWNER_USER_ID must be user id of user that can add/manage accounts
DATABASE_URL is the one you either get from atlas or your self hosted instance

Once these everything is done, you can launch the bot by doing

```
npm run start
```

This will compile the typescript files into classic javascript and run them. You should get message like `Started Monitoring accounts.` if everything went right.

That's all, enjoy.

### Issues, suggestions, contributions

Please report all issues to this github page and for sugguestions DM me on my discord account `pixeluted`.
If you want to contribute just fork this repository and do a pull request.

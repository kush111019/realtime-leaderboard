This is a kind of online gamming application in which user first need to be registered and then login. In order to register I am using REST api while in order to login , update the score , and fetch the top N users I am using socket.io in so that real time data can be accessed as game is being played online. As it is a fully backend application , thus I did not use any front end library like React but instead I am using basic command prompt to replicate the front end UI. So the user will first need to register using Rest api and after that he can open as many as command prompt windows as the number of users and run the command node client.js in the src folder. 
This will start the client server on the command prompt and after that he can login and after that he will have 3 options in the menu like update(u) , top N records(t), and logout(q). options . If any particular user will update it's score then the same will be reflected in the top N records in all the users windows which are in the same region(rooms are divided based on the region). Filteration is applied on the update and top N records so that we can update and fetch the records of only those users which are in the same region and mode.
Furthermore , I have also implemented the TTL Logic for daily resets so that the data in the leadgerboard table will get expires after every 24 hours. Also I have maintained the User collection along with the leaderboard collection in the database. As asked in the requirements , I have also set the Indexes on the leadgerboard Schema filtering by region and mode , sorting by score and update , and fetching top N leaderboard records efficiently.
steps to run the applications:
1) git clone https://github.com/kush111019/realtime-leaderboard.git
2) Create the database in the mongoDB with the name realtimeDB
3) You need to have mongoDB installed in your system as I am using local database not remote
4) Just for your easiness I have also pushed the .env file here which we we must not do in real senario. But it is just for your convince. 
5) npm install
6) Start the server from the root of the project directory using the command npm start
7) First create some users by hitting the register api from the postmand whose end point is http://localhost:4000/auth/register and json body is as given below
{
  "name": "User 6",
  "email": "user6@example.com",
  "password": "123456",
  "region": "UK",
  "mode": "ranked"
}
like this create some users
8) Open the command prompt and run the command node client.js in the src folder
9) It will prompt you to login and then you can update the score and fetch the top N records from the available options
10) Data will get updated in real time without any refresh or hitting t tab everytime.

ENJOY!

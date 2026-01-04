#todo
implement game-logic

you can have a elo for each language:
portuguese, spanish, english, italian, french, german, japanese, korean.

custom-lobby:
user determine the lobby settings
duration of questions(30 sec 45 sec or 60 sec)
difficulty of questions: easy, medium, hard
power-ups: true or false

battle-mode:
5 questions.
each question have a duration of 45 seconds
difficulty of questions: (its elo based, if the lobby is a beginner lobby it only contains easy questions, if mid-ladder lobby: easy to medium questions if high-elo: medium to hard questions, if top percent: only hard questions)

to determine a winner:
both players engage in the same set of questions
they are evaluated by the accuracy of answers.
the questions are multiple choice each having 4 choices.
they must do text comprehension and grammar
the most accurate player wins the match.
if a tie: the faster player wins.
if another tie: draw.


and furthermore listening(to implement in the future.)

power-ups:
freeze(frost ice icon): freezes your timer(cooldown 60 sec)
burn(fire icon): speeds up your opp timer(cooldown 60 sec)

timer: is a burning rope with animation
onboard mode

if user first battle:

quick tutorial(less than 60 sec to understand the game basics)
battle against CPU

achievements, rewards and badges based on progress.

flashcards are not working as intended. they should highlight the keyword. when the user is hovering the keyword it should give an explaination of the word. when the user taps the flashcard it should flip over with an animation with the original text and the translated text below.

the highlight is working fine. now we just need to adjust the proportions of flashcard. currently the flashcard have too many blank space lying around for the size of text. and when you tap it it only shows the 2 buttons known it and dont known, and the animation of flipping over doesnt happen. also these buttons can be displayed all the time no need to hide and display on click

you can use a bit of time and make sure both players are synced and ready to play the match before starting it to avoid just 1        
  player entering the lobby, and maybe implement retrying so if an player disconnects it can rejoin it after the connection stabilizes


async battle mode:
IMPLEMENT.
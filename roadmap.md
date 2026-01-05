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
freeze(frost ice icon)
burn(fire icon)
now lets dig into the synchronous battle mode, we are going to implement power-ups to be more interactive in synchronous battle. users can equip one 
power-up before entering a synchronous match. the power ups are freeze(freeze your timer for the current question so you have more time to think and 
subtracts 5 seconds from your overall time(considered for draws purpose), and burn which speeds up your opponent timer for current question. if a user uses      
freeze and the opponent uses burn it should burn the frozen timer and start ticking normal again if a player is burning and freezes the timer, it should stop    
 the burn effect. each power-up have their own cooldown

timer: is a burning rope with animation
onboard mode

if user first battle:

quick tutorial(less than 60 sec to understand the game basics)
battle against CPU

achievements, rewards and badges based on progress.

flashcards are not working as intended. they should highlight the keyword. when the user is hovering the keyword it should give an explaination of the word. when the user taps the flashcard it should flip over with an animation with the original text and the translated text below.

the highlight is working fine. now we just need to adjust the proportions of flashcard. currently the flashcard have too many blank space lying around for the size of text. and when you tap it it only shows the 2 buttons known it and dont known, and the animation of flipping over doesnt happen. also these buttons can be displayed all the time no need to hide and display on click

more questions, generate questions daily using api, don't repeat questions often use the same subject text but change the question being made, be creative about questions.


onboard: quick tutorial -50sec, choose favourite language.
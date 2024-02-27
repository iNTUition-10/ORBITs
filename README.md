## ✨Inspiration
University Students often messed up for course registration, especially with NTU's hard-to-use STARS system, with the course planning info hard to find and the time clash frequently occur. Personal preference cannot met, that’s where we come in. 

## 💡What it does
We provide a user-friendly browser plugin that automatically help student allocate their preferred course slots, without trying all the timetable clashes!

## 🚀How we built it
We built it with Google Chrome Plugin APIs, the main data processing part is done with JavaScript, UI built with HTML+JS+CSS, we also used Google Chrome APIs to inject the webpage and realize automation.

## 👾Challenges we ran into
- Met some problems with async or managing multiple HTTP requests at the same time, find it hard to match the i/o ports between the upper layer and kernel programs, especially with the programming contexts of JavaScript.
- Each course consists of various types of sessions, such as lectures (lec), tutorials (tut), seminars (sem), and lab classes (lab). To ensure there are no scheduling conflicts between courses, it's essential to thoroughly consider each session.
- We internally sort each item according to user preferences and sequentially conduct conflict checks with already selected entries. If any item within a course conflicts with any entry from any of the already chosen courses, we must abandon this index.

## ⭐Accomplishments that we're proud of
Developed NTU’s first automated, optimized, customizable course registration system, in form of a chrome plugin so it can be easily rewrite to suit other UNIs to use. No backend needed!

## 🎓What we learned
We learned better referencing parameters, and algorithms to sort data, as well as extension accessing permission management and browser runtime event bridge.

## 🌏What's next for Orbits
 More users, more universities supported, better user interface, and better automation.

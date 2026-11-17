/** Convenience barrel: require("../models") gives access to every model. */

module.exports = {
  User: require("./user"),
  TestResult: require("./test-result"),
  PersonalBest: require("./personal-best"),
  Word: require("./word"),
  Quote: require("./quote"),
  Course: require("./course"),
  Lesson: require("./lesson"),
  UserProgress: require("./user-progress"),
  Challenge: require("./challenge"),
  ChallengeAttempt: require("./challenge-attempt"),
  Badge: require("./badge"),
  Setting: require("./setting"),
};

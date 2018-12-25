workflow "Build" {
  on = "push"
  resolves = ["jshint"]
}

action "GitHub Action for npm" {
  uses = "actions/npm@e7aaefe"
  runs = "npm install"
}

action "jshint" {
  uses = "actions/npm@e7aaefe"
  needs = ["GitHub Action for npm"]
  runs = "jshint --exclude **/*.min.js,**/materialize.js,**/jquery.js public"
}

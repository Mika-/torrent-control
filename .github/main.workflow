workflow "Install and Test" {
  on = "push"
  resolves = ["Test"]
}

action "Install" {
  uses = "Borales/actions-yarn@master"
  args = "install"
}

action "Test" {
  needs = "Install"
  uses = "Borales/actions-yarn@master"
  args = "test"
}
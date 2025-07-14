{ pkgs, craneLib }:

let
  src = pkgs.fetchFromGitHub {
    owner = "rust-mcp-stack";
    repo = "rust-mcp-filesystem";
    rev = "v0.2.2"; # You can specify a specific commit or tag here if needed
    # sha256 = pkgs.lib.fakeSha256; # Replace with actual hash after first attempt
    sha256 = "sha256-5RxjMhnG6l2b1xIbiK/UxP8T/JoQ0aFKn78Sy/aegt0=";
  };

  # Build dependencies separately to improve caching
  cargoArtifacts = craneLib.buildDepsOnly {
    inherit src;
    pname = "filesystem-deps";
  };

  # Build the filesystem package
  filesystem = craneLib.buildPackage {
    inherit cargoArtifacts src;
    pname = "rust-mcp-filesystem";
    version = "0.2.2";
  };
in
filesystem

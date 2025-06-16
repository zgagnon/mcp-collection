{ pkgs, craneLib }:

let
  src = pkgs.fetchFromGitHub {
    owner = "rust-mcp-stack";
    repo = "rust-mcp-filesystem";
    rev = "main"; # You can specify a specific commit or tag here if needed
    # sha256 = pkgs.lib.fakeSha256; # Replace with actual hash after first attempt
    sha256 = "sha256-tbCSL/bOVDFGsvIGPNDETq3WJNk2eoIhsJz6w5T20bY=";
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
    version = "0.1.0";
  };
in
filesystem

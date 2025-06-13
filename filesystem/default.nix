{ pkgs, craneLib }:

let
  src = pkgs.lib.cleanSourceWith {
    src = ./.;
    filter = path: type: 
      builtins.elem (baseNameOf path) [ "Cargo.lock" "Cargo.toml" ]
      || (pkgs.lib.hasPrefix "${toString ./.}/src" path);
  };

  # Build dependencies separately to improve caching
  cargoArtifacts = craneLib.buildDepsOnly {
    inherit src;
    pname = "filesystem-deps";
  };

  # Build the filesystem package
  filesystem = craneLib.buildPackage {
    inherit cargoArtifacts src;
    pname = "filesystem";
    version = "0.1.0";
  };
in filesystem

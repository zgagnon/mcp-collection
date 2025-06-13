{
  description = "MCP server development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    crane = {
      url = "github:ipetkov/crane";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      crane,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
        craneLib = crane.mkLib pkgs;
        filesystemPkg = import ./filesystem { inherit pkgs craneLib; };
      in
      {
        packages = {
          # Add the filesystem package as an output
          filesystem = filesystemPkg;
          default = filesystemPkg;
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20 # Latest LTS version
            nodePackages.npm
            nodePackages.yarn
            nodePackages.typescript
            nodePackages.typescript-language-server
            nodePackages.ts-node # For running TypeScript directly
            nodePackages.prettier # Code formatting
            nodePackages.eslint # Linting
            git
            jq # Useful for JSON manipulation
            # Add Rust development tools
            rustc
            cargo
            rustfmt
            clippy
            rust-analyzer
          ];

          shellHook = ''
            echo "MCP server development environment"
            echo "Node.js $(node --version)"
            echo "npm $(npm --version)"

            # Add node_modules/.bin to PATH
            export PATH="$PWD/node_modules/.bin:$PATH"
          '';
        };
      }
    );
}

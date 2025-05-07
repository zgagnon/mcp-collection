{
  description = "MCP server development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        packages = {
          # We could define a build package here if needed
          # For now, this would typically be handled by npm/yarn scripts
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20  # Latest LTS version
            nodePackages.npm
            nodePackages.yarn
            nodePackages.typescript
            nodePackages.typescript-language-server
            nodePackages.ts-node  # For running TypeScript directly
            nodePackages.prettier # Code formatting
            nodePackages.eslint   # Linting
            git
            jq                    # Useful for JSON manipulation
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
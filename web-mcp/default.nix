{
  lib,
  buildNpmPackage,
  nodejs_20,
}:

buildNpmPackage rec {
  pname = "web-mcp";
  version = "0.6.2";

  src = ./.;

  # This needs to be calculated with:
  # nix-shell -p prefetch-npm-deps --run "prefetch-npm-deps ./package-lock.json"
  npmDepsHash = "sha256-uuWYyWct7PvX5jz+wR2s04wn9fgFZ4IA2e4/iDJWq6w=";

  buildInputs = [ nodejs_20 ];

  meta = with lib; {
    description = "MCP server for web access";
    license = licenses.mit;
    maintainers = [ ];
    platforms = platforms.unix;
  };
}

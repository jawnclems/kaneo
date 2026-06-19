  Going forward:                                                                                                      
  - Pull Kaneo updates: git fetch upstream && git merge upstream/main                                                   
  - Push your changes: git push origin main                                                                           
  - When they ship a new Docker image: docker compose down && docker compose pull && docker compose up -d (data persists
   in the named volume, only the app container is replaced) 
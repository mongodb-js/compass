sudo apt-get update
sudo apt-get install -y xvfb
                  
sudo cp $(pwd)/.evergreen/etc-init.d-xvfb /etc/init.d/xvfb
#chmod +x /etc/init.d/xvfb

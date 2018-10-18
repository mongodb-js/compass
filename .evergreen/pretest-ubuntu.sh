sudo apt-get update
sudo apt-get install -y x11-utils x11-xserver-utils xserver-xorg-core xvfb dbus-x11
                  
sudo cp $(pwd)/.evergreen/etc-init.d-xvfb /etc/init.d/xvfb
#chmod +x /etc/init.d/xvfb

FROM amazonlinux:latest

run yum update -y
run curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
run yum -y install nodejs wget fontconfig ruby ruby-devel
run yum groupinstall -y 'Development Tools'
run gem install fpm
run npm install -g yarn

WORKDIR /root
run mkdir go
run wget https://storage.googleapis.com/golang/go1.7.5.linux-amd64.tar.gz -O go/go1.7.5.linux-amd64.tar.gz
run tar -C /usr/local -xzf go/*.tar.gz
run rm -rf go
env PATH $PATH:/usr/local/go/bin

run mkdir -p /usr/local/go/src/github.com/grafana
ADD . /usr/local/go/src/github.com/grafana/grafana

WORKDIR /usr/local/go/src/github.com/grafana/grafana
run rm -rf node_modules
run yarn install --pure-lockfile
run go run build.go pkg-rpm

CMD base64 dist/grafana-*.rpm

# docker build . -t grafana_rpm && docker run grafana_rpm | base64 -D > ~/Desktop/grafana.rpm

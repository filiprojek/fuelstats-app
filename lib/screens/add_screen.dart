import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/vehicle.dart';
import '../services/session_manager.dart';

class AddScreen extends StatefulWidget {
  @override
  _AddScreenState createState() => _AddScreenState();
}

class _AddScreenState extends State<AddScreen> {
  final _formKey = GlobalKey<FormState>();

  String? _selectedVehicleId;
  FuelType? _selectedFuelType;
  final TextEditingController _litersController = TextEditingController();
  final TextEditingController _pricePerLiterController =
      TextEditingController();
  final TextEditingController _totalPriceController = TextEditingController();
  final TextEditingController _mileageController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final session = Provider.of<SessionManager>(context);
    _selectedVehicleId ??= session.defaultVehicle?.id;
    _selectedFuelType ??= session.defaultVehicle?.fuelType;
  }

  @override
  Widget build(BuildContext context) {
    final session = Provider.of<SessionManager>(context);
    final vehicles = session.vehicles;
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  decoration: InputDecoration(labelText: 'Vehicle'),
                  value: _selectedVehicleId,
                  items: vehicles
                      .map(
                        (vehicle) => DropdownMenuItem(
                          value: vehicle.id,
                          child: Text(vehicle.name),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedVehicleId = value;
                      final vehicle =
                          vehicles.firstWhere((v) => v.id == value);
                      _selectedFuelType = vehicle.fuelType;
                    });
                  },
                  validator:
                      (value) => value == null ? 'Please select a vehicle' : null,
                ),
                SizedBox(height: 16),
                DropdownButtonFormField<FuelType>(
                  decoration: InputDecoration(labelText: 'Fuel Type'),
                  value: _selectedFuelType,
                  items: FuelType.values
                      .map((fuel) => DropdownMenuItem(
                            value: fuel,
                            child: Text(fuel.label),
                          ))
                      .toList(),
                  onChanged: (value) => setState(() => _selectedFuelType = value),
                  validator:
                      (value) => value == null ? 'Please select a fuel type' : null,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _litersController,
                  decoration: InputDecoration(labelText: 'Liters'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _pricePerLiterController,
                  decoration: InputDecoration(labelText: 'Price per Liter'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _totalPriceController,
                  decoration: InputDecoration(labelText: 'Total Price'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _mileageController,
                  decoration: InputDecoration(labelText: 'Mileage'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _noteController,
                  decoration: InputDecoration(labelText: 'Note'),
                  keyboardType: TextInputType.text,
                ),
                SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _submitForm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green, // green confirm button
                  ),
                  child: Text('Create Fuel Record'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String? _numberValidator(String? value) {
    if (value == null || value.isEmpty) return 'This field cannot be empty';
    if (double.tryParse(value) == null) return 'Enter a valid number';
    return null;
  }

  void _submitForm() {
    if (_formKey.currentState?.validate() ?? false) {
      // Here you would save the form data to database or state
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Fuel record created successfully!')),
      );
    }
  }
}
